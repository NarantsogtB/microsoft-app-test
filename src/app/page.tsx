"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [accessToken, setAccessToken] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Teams + Channels татах
  const fetchTeams = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notify?accessToken=${accessToken}`);
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error("Teams татахад алдаа:", error);
      alert("Teams татахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  // Notification явуулах
  const sendNotification = async () => {
    if (!selectedTeam || !selectedChannel) {
      alert("Team болон Channel сонгоно уу!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          teamId: selectedTeam,
          channelId: selectedChannel,
        }),
      });
      const data = await res.json();
      alert(JSON.stringify(data));
    } catch (error) {
      console.error("Notification явуулахад алдаа:", error);
      alert("Notification явуулахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchTeams();
    }
  }, [accessToken]);

  return (
    <main style={{ padding: 20 }}>
      <h1>Teams Notification Dev Mode</h1>

      <p>
        **Dev Mode:** Access token-г input box-д оруулж тест хийнэ. (Teams SDK
        SSO-г энэ үед ашиглахгүй)
      </p>

      <input
        placeholder="Access Token-г оруулна уу"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <button onClick={fetchTeams}>Fetch Teams</button>
      <br />
      <br />

      {loading && <p>Татаж байна...</p>}

      {teams.length > 0 && (
        <>
          <label>Team сонгоно уу:</label>
          <br />
          <select
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              setSelectedChannel("");
            }}
            value={selectedTeam}
          >
            <option value="">Сонгох Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.displayName}
              </option>
            ))}
          </select>
          <br />
          <br />

          {selectedTeam && (
            <>
              <label>Channel сонгоно уу:</label>
              <br />
              <select
                onChange={(e) => setSelectedChannel(e.target.value)}
                value={selectedChannel}
              >
                <option value="">Сонгох Channel</option>
                {teams
                  .find((t) => t.id === selectedTeam)
                  ?.channels.map((ch: any) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.displayName}
                    </option>
                  ))}
              </select>
              <br />
              <br />
              <button onClick={sendNotification}>Send Notification</button>
            </>
          )}
        </>
      )}
    </main>
  );
}
