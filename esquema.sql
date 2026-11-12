-- Habilitar extensión pgvector (solo la primera vez, persiste en el volumen)
CREATE EXTENSION IF NOT EXISTS vector;

-- Borrar y recrear la tabla para poder reindexar desde cero
DROP TABLE IF EXISTS fragmentos;

CREATE TABLE fragmentos (
  id        SERIAL PRIMARY KEY,
  fuente    TEXT,
  seccion   TEXT,
  posicion  INTEGER,
  texto     TEXT,
  embedding VECTOR(768)
);

-- Índice HNSW para búsqueda rápida por distancia coseno
CREATE INDEX ON fragmentos USING hnsw (embedding vector_cosine_ops);
