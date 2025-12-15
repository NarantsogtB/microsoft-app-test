"use client";

import { useState } from "react";

export default function Home() {
  const [accessToken, setAccessToken] = useState("");
  const [teamId, setTeamId] = useState("");
  const [channelId, setChannelId] = useState("");

  const login = () => {
    window.location.href = "/auth"; // Teams SSO login
  };

  const sendNotification = async () => {
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, channelId, accessToken }),
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Teams SSO Notification MVP</h1>
      <button onClick={login}>Login via Teams SSO</button>
      <br />
      <br />
      <input
        placeholder="Team ID"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      />
      <br />
      <input
        placeholder="Channel ID"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
      />
      <br />
      <input
        placeholder="Access Token"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
      />
      <br />
      <button onClick={sendNotification}>Send Notification</button>
    </main>
  );
}
