// preguntar.mjs — Interface de consola para el RAG

import readline from "node:readline";
import { rag } from "./rag.mjs";
import { obtenerPool } from "./db.mjs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🩺 RAG Vacunas — Consultá sobre vacunación humana y de mascotas");
console.log('   Escribí "salir" para terminar.\n');

function preguntar() {
  rl.question("Tu pregunta: ", async (pregunta) => {
    pregunta = pregunta.trim();
    if (!pregunta || pregunta.toLowerCase() === "salir") {
      console.log("¡Hasta luego!");
      await obtenerPool().end();
      rl.close();
      return;
    }

    try {
      console.log("\n⏳ Buscando...\n");
      const { respuesta, fuentes } = await rag(pregunta);
      console.log("─".repeat(60));
      console.log(respuesta);
      if (fuentes.length > 0) {
        console.log("\n📚 Fragmentos recuperados:");
        fuentes.forEach((f, i) => {
          const origen = [f.fuente, f.seccion].filter(Boolean).join(" › ");
          console.log(`  [${i + 1}] ${origen} (dist: ${f.distancia?.toFixed(3)})`);
        });
      }
      console.log("─".repeat(60) + "\n");
    } catch (err) {
      console.error("Error:", err.message);
    }

    preguntar();
  });
}

preguntar();
