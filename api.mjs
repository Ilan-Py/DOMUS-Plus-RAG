// api.mjs — embeddings via Ollama (bge-m3) + respuestas via Google Gemini

const OLLAMA_URL = "http://127.0.0.1:11434/api/embeddings";
/**const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";*/
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

/**
 * Genera el vector de embedding para un texto usando Ollama + bge-m3.
 * Dimensión de salida: 1024 (coincide con la columna VECTOR(1024) en Postgres).
 */
export async function embedding(texto) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 300000); // 5 min

  try {
    const resp = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", prompt: texto, keep_alive: "30m" }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Ollama error ${resp.status}: ${err}`);
    }

    const data = await resp.json();
    return data.embedding;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Llama a Gemini Flash para generar la respuesta final.
 * @param {string} prompt  - Prompt completo (contexto + pregunta)
 * @returns {string}       - Texto de la respuesta
 */
export async function responder(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en las variables de entorno.");

  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "(sin respuesta)";
}
