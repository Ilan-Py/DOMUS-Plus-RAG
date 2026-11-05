// indexar.mjs — Lee el corpus, trocea, embede e inserta en Postgres

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { trocearPorMarca } from "./trocear.mjs";
import { embedding } from "./api.mjs";
import { obtenerPool } from "./db.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const CARPETA_CORPUS = join(__dir, "corpus");
const TAMANO_LOTE = 10; // fragmentos a procesar antes de hacer pausa

const pool = obtenerPool();

// Vaciar la tabla antes de indexar (evita duplicados al reindexar)
await pool.query("TRUNCATE TABLE fragmentos RESTART IDENTITY");
console.log("Tabla vaciada. Comenzando indexación...\n");

const archivos = (await readdir(CARPETA_CORPUS)).filter((f) => f.endsWith(".txt"));

let totalFragmentos = 0;

for (const archivo of archivos) {
  const ruta = join(CARPETA_CORPUS, archivo);
  const corpus = await readFile(ruta, "utf8");
  const fragmentos = trocearPorMarca(corpus);

  console.log(`📄 ${archivo}: ${fragmentos.length} fragmentos`);

  let lote = 0;
  for (const f of fragmentos) {
    const vector = await embedding(f.texto);
    const comoVector = JSON.stringify(vector); // pgvector necesita [n1, n2, ...]

    await pool.query(
      `INSERT INTO fragmentos (fuente, seccion, posicion, texto, embedding)
       VALUES ($1, $2, $3, $4, $5)`,
      [f.fuente, f.seccion, f.posicion, f.texto, comoVector]
    );

    lote++;
    totalFragmentos++;

    if (lote % TAMANO_LOTE === 0) {
      process.stdout.write(`  → ${lote}/${fragmentos.length} fragmentos\r`);
    }
  }
  console.log(`  ✓ ${fragmentos.length} fragmentos insertados`);
}

console.log(`\n✅ Indexación completa: ${totalFragmentos} fragmentos en total.`);
await pool.end();
