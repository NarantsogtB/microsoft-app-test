"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [authUrl, setAuthUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    fetch("/app/auth/route")
      .then((r) => r.json())
      .then((data) => setAuthUrl(data.authUrl));
  }, []);

  const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    const res = await fetch(`/app/auth/callback?code=${code}`);
    const data = await res.json();
    setAccessToken(data.access_token);
  };

  const sendNotification = async () => {
    if (!accessToken) return alert("Sign in first");
    const recipientUserId = "89f62c53-0c5c-4b57-a60a-a3fdad11490d";
    const res = await fetch("/app/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientUserId, accessToken }),
    });
    const data = await res.json();
    console.log("Notification response:", data);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Next.js + Teams Notification MVP</h1>
      {!accessToken ? (
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
      ) : (
        <button
          onClick={sendNotification}
          style={{
            padding: "1rem",
            background: "#107c10",
            color: "white",
            borderRadius: "5px",
          }}
        >
          Send Notification
        </button>
      )}
    </div>
  );
}
