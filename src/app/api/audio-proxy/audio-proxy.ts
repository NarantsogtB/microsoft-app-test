// src/pages/api/audio-proxy.ts
import { NextApiRequest, NextApiResponse } from "next";
// import fetch from "node-fetch";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const fileUrl = req.query.file as string;
    if (!fileUrl) {
      return res.status(400).send("Missing 'file' query parameter");
    }

    // Dropbox-аас file-г авах
    // Dropbox share link-ыг raw download URL болгож задална
    let downloadUrl = fileUrl
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .split("?")[0];

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      return res
        .status(response.status)
        .send(`Failed to fetch file: ${response.statusText}`);
    }

    // Content-Type-г хадгална
    const contentType = response.headers.get("content-type") || "audio/wav";

    // Streaming response-д дамжуулна
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (err: any) {
    console.error("Audio proxy error:", err);
    res.status(500).send("Internal server error");
  }
}
