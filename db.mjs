import pg from "pg";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const { Pool } = pg;

// Lee el .env si no hay variables de entorno ya cargadas
const __dir = dirname(fileURLToPath(import.meta.url));

let pool;

export function obtenerPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgres://postgres:rag@localhost:5433/postgres";
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function consultar(sql, params = []) {
  const pool = obtenerPool();
  const { rows } = await pool.query(sql, params);
  return rows;
}
