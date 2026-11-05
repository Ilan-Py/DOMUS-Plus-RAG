import { MARCA_FUENTE, MARCA_SECCION } from "./marca.mjs";

const TAMANO_MAX = 1800; // caracteres por fragmento

/**
 * Divide el corpus en fragmentos preservando la fuente y sección.
 * El corpus tiene el formato:
 *   === FUENTE: Nombre ===
 *   <texto libre, puede tener subtítulos>
 *
 * Retorna un arreglo de objetos { fuente, seccion, posicion, texto }
 */
export function trocearPorMarca(corpus) {
  const lineas = corpus.split("\n");
  const fragmentos = [];

  let fuente = null;
  let seccion = null;
  let buffer = [];
  let posicion = 0;

  function guardar() {
    const texto = buffer.join("\n").trim();
    if (texto.length < 40) return; // descartar fragmentos muy cortos

    if (texto.length <= TAMANO_MAX) {
      fragmentos.push({ fuente, seccion, posicion, texto });
      posicion++;
    } else {
      // Fragmento demasiado largo: cortar en bloques de TAMANO_MAX con 200 de overlap
      let inicio = 0;
      while (inicio < texto.length) {
        const trozo = texto.slice(inicio, inicio + TAMANO_MAX);
        fragmentos.push({ fuente, seccion, posicion, texto: trozo });
        posicion++;
        inicio += TAMANO_MAX - 200;
      }
    }
  }

  for (const linea of lineas) {
    const matchFuente = linea.match(MARCA_FUENTE);
    if (matchFuente) {
      guardar();
      buffer = [];
      fuente = matchFuente[1].trim();
      seccion = null;
      posicion = 0;
      continue;
    }

    const matchSeccion = linea.match(MARCA_SECCION);
    if (matchSeccion && fuente) {
      guardar();
      buffer = [];
      seccion = linea.trim();
      continue;
    }

    buffer.push(linea);
  }

  guardar(); // último fragmento
  return fragmentos;
}
