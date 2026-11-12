// buscar.mjs — Búsqueda semántica en Postgres con pgvector

import { consultar } from "./db.mjs";
import { embedding } from "./api.mjs";

// Umbral de similitud coseno (0 = idéntico, 2 = opuesto en distancia coseno pgvector)
// Distancia < 0.4 → similitud alta; ajustar con la Ficha 4 de la guía
const UMBRAL_DISTANCIA = 0.55;
const K = 4; // cantidad máxima de fragmentos a recuperar

/**
 * Busca los K fragmentos más similares a la pregunta.
 * @param {string} pregunta
 * @returns {Array<{fuente, seccion, texto, distancia}>}
 */
export async function buscar(pregunta) {
  const vector = await embedding(pregunta);
  const comoVector = JSON.stringify(vector);

  const filas = await consultar(
    `SELECT fuente, seccion, texto,
            embedding <=> $1 AS distancia
     FROM fragmentos
     WHERE embedding <=> $1 < $2
     ORDER BY distancia
     LIMIT $3`,
    [comoVector, UMBRAL_DISTANCIA, K]
  );

  return filas;
}
