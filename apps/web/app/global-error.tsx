"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b0f14",
          color: "#e7eef4",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#e5484d", letterSpacing: "0.2em", fontSize: 12 }}>ERROR</p>
          <h1 style={{ fontSize: 28, margin: "12px 0" }}>Catch The Flag</h1>
          <p style={{ color: "#93a4b3" }}>A critical error occurred. Please try again.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#f2b544",
              color: "#1a1305",
              border: 0,
              borderRadius: 6,
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
