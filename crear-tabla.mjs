import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { obtenerPool } from "./db.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const sql = await readFile(join(__dir, "esquema.sql"), "utf8");

const pool = obtenerPool();
await pool.query(sql);
console.log("Tabla 'fragmentos' creada (o recreada) correctamente.");
await pool.end();
