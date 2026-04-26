from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import wikipedia
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import pickle
import os
import re
from typing import Optional

app = FastAPI(
    title="Wikipedia RAG API",
    description="Arabic & English Wikipedia RAG System using FAISS + Sentence Transformers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global state ──────────────────────────────────────────────
model = None
index = None
chunks = []
INDEX_PATH = "wiki_index.faiss"
CHUNKS_PATH = "wiki_chunks.pkl"


def get_model():
    global model
    if model is None:
        model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    return model


def load_or_create_index():
    global index, chunks
    if os.path.exists(INDEX_PATH) and os.path.exists(CHUNKS_PATH):
        index = faiss.read_index(INDEX_PATH)
        with open(CHUNKS_PATH, "rb") as f:
            chunks = pickle.load(f)
        print(f"✅ Loaded existing index with {len(chunks)} chunks")
    else:
        index = faiss.IndexFlatL2(384)  # MiniLM-L12 dim = 384
        chunks = []
        print("✅ Created new empty FAISS index")


def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> list[str]:
    sentences = re.split(r'(?<=[.!?؟])\s+', text)
    result, current = [], []
    count = 0
    for sent in sentences:
        words = sent.split()
        if count + len(words) > chunk_size and current:
            result.append(" ".join(current))
            overlap_words = current[-overlap:] if len(current) >= overlap else current
            current = overlap_words + words
            count = len(current)
        else:
            current.extend(words)
            count += len(words)
    if current:
        result.append(" ".join(current))
    return result


def add_to_index(new_chunks: list[str]):
    global index, chunks
    m = get_model()
    embeddings = m.encode(new_chunks, convert_to_numpy=True, normalize_embeddings=True)
    index.add(embeddings.astype("float32"))
    chunks.extend(new_chunks)
    faiss.write_index(index, INDEX_PATH)
    with open(CHUNKS_PATH, "wb") as f:
        pickle.dump(chunks, f)


def retrieve(query: str, top_k: int = 5) -> list[str]:
    if index.ntotal == 0:
        return []
    m = get_model()
    q_vec = m.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    distances, indices = index.search(q_vec.astype("float32"), min(top_k, index.ntotal))
    return [chunks[i] for i in indices[0] if i < len(chunks)]


# ── Startup ───────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    get_model()
    load_or_create_index()


# ── Request/Response Models ───────────────────────────────────
class SearchRequest(BaseModel):
    query: str
    lang: Optional[str] = "ar"   # "ar" or "en"
    top_k: Optional[int] = 5


class ChatRequest(BaseModel):
    message: str
    lang: Optional[str] = "auto"  # "ar", "en", "auto"


class IndexRequest(BaseModel):
    topic: str
    lang: Optional[str] = "ar"
    sentences: Optional[int] = 20


# ── Endpoints ─────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "🌍 Wikipedia RAG API is running",
        "docs": "/docs",
        "endpoints": ["/index", "/search", "/chat", "/stats"]
    }


@app.post("/index")
def index_topic(req: IndexRequest):
    """Fetch a Wikipedia article and add it to FAISS index."""
    try:
        wikipedia.set_lang(req.lang)
        page = wikipedia.page(req.topic, auto_suggest=True)
        text = page.content[:15000]   # cap at ~15k chars
        new_chunks = chunk_text(text)
        add_to_index(new_chunks)
        return {
            "status": "indexed",
            "topic": page.title,
            "lang": req.lang,
            "chunks_added": len(new_chunks),
            "total_chunks": len(chunks)
        }
    except wikipedia.exceptions.DisambiguationError as e:
        raise HTTPException(400, f"Ambiguous topic. Options: {e.options[:5]}")
    except wikipedia.exceptions.PageError:
        raise HTTPException(404, f"Wikipedia page not found: {req.topic}")
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/search")
def search(req: SearchRequest):
    """Retrieve relevant chunks for a query."""
    results = retrieve(req.query, req.top_k)
    if not results:
        return {"query": req.query, "results": [], "note": "Index is empty — use /index first"}
    return {"query": req.query, "results": results}


@app.post("/chat")
def chat(req: ChatRequest):
    """
    RAG Chat: retrieve context from FAISS then build an answer.
    (In production, pipe context into an LLM; here we return top chunks as the answer.)
    """
    lang = req.lang
    if lang == "auto":
        # Heuristic: if >30% chars are Arabic script → ar
        ar_chars = sum(1 for c in req.message if '\u0600' <= c <= '\u06FF')
        lang = "ar" if ar_chars / max(len(req.message), 1) > 0.3 else "en"

    results = retrieve(req.message, top_k=4)

    if not results:
        no_data = (
            "لم أجد معلومات كافية. يرجى إضافة مواضيع أولاً عبر /index"
            if lang == "ar" else
            "No data indexed yet. Please add topics via /index first."
        )
        return {"answer": no_data, "sources": [], "lang": lang}

    context = "\n\n---\n\n".join(results)

    # Simple extractive answer (replace with LLM call for production)
    answer = (
        f"بناءً على المعلومات المتاحة:\n\n{context[:1200]}"
        if lang == "ar" else
        f"Based on available information:\n\n{context[:1200]}"
    )

    return {
        "answer": answer,
        "sources": results[:2],
        "lang": lang,
        "chunks_used": len(results)
    }


@app.get("/stats")
def stats():
    return {
        "total_chunks": len(chunks),
        "index_size": index.ntotal if index else 0,
        "model": "paraphrase-multilingual-MiniLM-L12-v2",
        "embedding_dim": 384
    }
