"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [authUrl, setAuthUrl] = useState("");

  useEffect(() => {
    fetch("/app/auth/route")
      .then((r) => r.json())
      .then((data) => setAuthUrl(data.authUrl));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Next.js + Teams Notification MVP</h1>
      <a
        href={authUrl}
        style={{
          padding: "1rem",
          background: "#6264a7",
          color: "white",
          borderRadius: "5px",
        }}
      >
        Sign in with Teams
      </a>
    </div>
  );
}
