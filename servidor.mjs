// servidor.mjs — Servidor HTTP que expone el RAG como API REST
// La GEMINI_API_KEY se mantiene en el servidor; nunca se expone al cliente.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rag } from "./rag.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  // ─── CORS (para desarrollo local) ───────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ─── API: POST /preguntar ────────────────────────────────────────────────
  if (req.method === "POST" && req.url === "/preguntar") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { pregunta } = JSON.parse(body);
        if (!pregunta || typeof pregunta !== "string") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Falta el campo 'pregunta'." }));
          return;
        }

        const { respuesta, fuentes } = await rag(pregunta.trim());
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ respuesta, fuentes }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ─── Archivos estáticos ──────────────────────────────────────────────────
  let ruta = req.url === "/" ? "/index.html" : req.url;
  // Seguridad: evitar path traversal
  if (ruta.includes("..")) {
    res.writeHead(403);
    res.end("Prohibido");
    return;
  }

  const ext = ruta.slice(ruta.lastIndexOf(".")) || "";
  const mime = MIME[ext] ?? "application/octet-stream";

  try {
    const contenido = await readFile(join(__dir, ruta));
    res.writeHead(200, { "Content-Type": mime });
    res.end(contenido);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("No encontrado");
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor RAG Vacunas corriendo en http://localhost:${PORT}`);
  console.log("   Abrí index.html en el navegador o usá la URL de arriba.");
});
