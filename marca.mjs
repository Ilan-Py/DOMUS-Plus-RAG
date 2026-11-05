// Estructura del corpus vacunas.txt
// Cada fuente comienza con:  === FUENTE: Nombre ===
// Cada sección (subtítulo) puede comenzar con una línea en MAYÚSCULAS
// o con patrones como "¿Qué es...?", "¿Cuándo...?", etc.

export const MARCA_FUENTE = /^=== FUENTE: (.+) ===$/;

// Reconoce subtítulos dentro de cada fuente: líneas en MAYÚSCULAS,
// preguntas frecuentes, o encabezados cortos (< 80 chars, sin punto final)
export const MARCA_SECCION = /^(#{1,3} .+|¿.+\?|[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\-\/]{4,}[A-ZÁÉÍÓÚÑ])$/;
