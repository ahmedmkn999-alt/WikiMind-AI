export const metadata = {
  title: "موسوعة الذكاء | Wikipedia RAG",
  description: "نظام RAG متعدد اللغات بالعربية والإنجليزية باستخدام FAISS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0a0c10" }}>
        {children}
      </body>
    </html>
  );
}
