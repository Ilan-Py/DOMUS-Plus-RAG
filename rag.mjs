// rag.mjs — Pipeline RAG exportable (usado por preguntar.mjs y servidor.mjs)

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buscar } from "./buscar.mjs";
import { responder } from "./api.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const PROMPT_TEMPLATE = await readFile(join(__dir, "prompt.txt"), "utf8");

/**
 * Ejecuta el pipeline RAG completo para una pregunta.
 * @param {string} pregunta
 * @returns {{ respuesta: string, fuentes: Array<{fuente, seccion, distancia}> }}
 */
export async function rag(pregunta) {
  // 1. Recuperar fragmentos relevantes
  const fragmentos = await buscar(pregunta);

  if (fragmentos.length === 0) {
    return {
      respuesta:
        "No encontré información sobre eso en mi base de datos de vacunas. Te recomiendo consultar Argentina.gob.ar o a tu profesional de salud.",
      fuentes: [],
    };
  }

  // 2. Armar el contexto para el prompt
  const bloqueContexto = fragmentos
    .map((f, i) => {
      const origen = [f.fuente, f.seccion].filter(Boolean).join(" › ");
      return `[${i + 1}] Fuente: ${origen}\n${f.texto}`;
    })
    .join("\n\n---\n\n");

  // 3. Construir el prompt final
  const prompt = PROMPT_TEMPLATE
    .replace("{{contexto}}", bloqueContexto)
    .replace("{{pregunta}}", pregunta);

  // 4. Llamar al LLM
  const respuesta = await responder(prompt);

  // 5. Deduplicar fuentes para la cita
  const fuentesVistas = new Set();
  const fuentes = fragmentos
    .map((f) => ({
      fuente: f.fuente,
      seccion: f.seccion,
      distancia: f.distancia,
    }))
    .filter((f) => {
      const clave = `${f.fuente}|${f.seccion}`;
      if (fuentesVistas.has(clave)) return false;
      fuentesVistas.add(clave);
      return true;
    });

  return { respuesta, fuentes };
}
