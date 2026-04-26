---
title: Wikipedia RAG API
emoji: 🌍
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# 🌍 Wikipedia RAG API

FastAPI backend with FAISS + Sentence Transformers for multilingual RAG (Arabic & English).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/index` | Index a Wikipedia topic |
| POST | `/search` | Semantic search |
| POST | `/chat` | RAG chat endpoint |
| GET | `/stats` | Index statistics |

## Quick Start

```bash
# Index a topic
curl -X POST "https://<your-space>.hf.space/index" \
  -H "Content-Type: application/json" \
  -d '{"topic": "الذكاء الاصطناعي", "lang": "ar"}'

# Chat
curl -X POST "https://<your-space>.hf.space/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "ما هو الذكاء الاصطناعي؟"}'
```
