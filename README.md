# RAG Vacunas — DOMUS+

Proyecto final UDI III · Exposición · IES Santa Fe

**Corpus:** 21 fuentes sobre vacunación humana (Argentina.gob.ar) y de mascotas (Royal Canin Argentina, WebMD)  
**Vectores:** almacenados en Postgres con pgvector (contenedor Docker)  
**Embeddings:** Ollama + modelo bge-m3 (local)  
**LLM:** Google Gemini 1.5 Flash (API key en el servidor)

---

## Requisitos previos

- Node.js 20+
- Docker
- Ollama con el modelo bge-m3 descargado
- Clave de API de Google Gemini

---

## Setup paso a paso

### 1. Levantar el contenedor Postgres con pgvector

```bash
docker run -d \
  --name rag-db \
  -e POSTGRES_PASSWORD=rag \
  -p 5433:5432 \
  -v rag-datos:/var/lib/postgresql/data \
  pgvector/pgvector:pg17
```

Verificar que corre: `docker ps | grep rag-db`

### 2. Levantar Ollama y descargar el modelo

```bash
ollama serve          # si no está corriendo
ollama pull bge-m3
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env y completar GEMINI_API_KEY
```

### 5. Crear la tabla en Postgres

```bash
npm run setup
```

### 6. Indexar el corpus (tarda ~15-30 min según hardware)

```bash
npm run indexar
```

Verás el progreso fuente por fuente. Al terminar se imprime el total de fragmentos.

### 7. Probar desde la consola (opcional)

```bash
npm run preguntar
```

### 8. Levantar el servidor web

```bash
npm start
```

Abrí el navegador en **http://localhost:3000**

---

## Estructura

```
rag-vacunas/
├── corpus/
│   └── vacunas.txt          # Corpus completo (21 fuentes)
├── .env.example             # Variables de entorno
├── package.json
├── db.mjs                   # Conexión a Postgres (pg)
├── esquema.sql              # CREATE TABLE fragmentos + HNSW index
├── crear-tabla.mjs          # Ejecuta esquema.sql
├── marca.mjs                # Expresiones regulares del corpus
├── trocear.mjs              # trocearPorMarca()
├── api.mjs                  # embedding() via Ollama + responder() via Gemini
├── indexar.mjs              # Trocea + embede + inserta en Postgres
├── buscar.mjs               # Búsqueda semántica con pgvector <=>
├── rag.mjs                  # Pipeline RAG exportable
├── preguntar.mjs            # Interface de consola
├── servidor.mjs             # Servidor HTTP (sirve index.html + API /preguntar)
├── prompt.txt               # Template del prompt
└── index.html               # Frontend web
```

---

## Calibración del umbral (Ficha 4 de la guía)

El umbral de distancia coseno está en `buscar.mjs`, constante `UMBRAL_DISTANCIA` (default: `0.45`).

- Valor **más bajo** → solo fragmentos muy similares, puede devolver 0 resultados
- Valor **más alto** → devuelve más fragmentos, puede incluir falsos positivos

Para calibrar: hacé preguntas del corpus y observá las distancias que muestra la consola.
Ajustá hasta que preguntas fuera del corpus devuelvan 0 fragmentos.
