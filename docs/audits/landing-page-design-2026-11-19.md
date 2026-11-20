# Aplicación de landing-page-design

Fecha: 19 de noviembre de 2026. Implementación local sobre `feature/template-dewi`.

## Criterio

Se aplicó la skill de `altoque/skills/frontend/landing-pages/landing-page-design/SKILL.md`, junto con sus contextos de ejecución y frontend. Se tomó la estrategia de una oferta clara, un recorrido comprensible y una acción principal: consultar por WhatsApp para recibir asesoramiento personal sin cargo.

La audiencia y el contenido se obtuvieron de la landing y del contexto del titular: personas que quieren asegurar su familia, patrimonio o actividad. No se presupone una mejora de conversiones medida; no se agregó seguimiento de usuarios.

| Criterio de la skill | Aplicación en esta página |
| --- | --- |
| Oferta y acción principal claras | Se unificó el texto del CTA de portada y contacto en «Consultá por WhatsApp». Los planes conservan consultas específicas por cobertura. |
| Prueba de experiencia cerca de la oferta | La portada muestra «Asesoramiento sin cargo · Más de 28 años de experiencia», usando el dato proporcionado por el titular. |
| Explicar cómo empieza la consulta | Servicios pasó de categorías repetidas a tres pasos: contar qué se quiere asegurar, revisar las opciones y elegir la cobertura. Se conservó el catálogo de seis planes. |
| Reducir dudas antes de consultar | Se agregó la pregunta «¿Qué información necesito para consultar?», con ejemplos para auto y propiedad. |
| Acción secundaria útil | La navegación hacia los planes permanece disponible. El formulario de email se presenta como alternativa al contacto por WhatsApp. |
| Jerarquía visual y estados | El proceso usa una introducción y una lista ordenada, entradas suaves y el hover celeste aprobado, con adaptación a móvil y ambos temas. |
| SEO y estados de error | Se alinearon título, descripción, Open Graph y Twitter; se agregó JSON-LD `InsuranceAgency` y una página 404 con acceso al inicio y WhatsApp. |

## Decisiones de adaptación

Se conservaron la familia en la playa, el encuadre responsive, los degradés, la identidad azul y dorada, el celular animado de escritorio, la franja de compañías, la FAQ y el contenido aprobado de Nosotros y Por qué elegirnos. Los ritmos de animación y scroll suavizados se mantienen. La introducción del nuevo proceso entra como un bloque para evitar animaciones anidadas.

Las opciones visuales de la skill se adaptaron a esta página existente, siguiendo su contexto frontend. No requieren cambiar el framework, la paleta ni la tipografía. El mensaje «Servicio y Compromiso» ya cumple la función de expresar el enfoque del broker; no se añadió otro eslogan. Los testimonios retirados por el titular no se reincorporaron. No se inventaron reseñas, precios, garantías, horarios, matrículas ni direcciones postales completas.

No se crearon páginas legales con contenido supuesto. Se conserva el aviso del formulario y la integración existente con Formspree. La validación del navegador no sustituye los controles del proveedor.

## Metadatos y 404

El objeto `InsuranceAgency` usa únicamente datos existentes en la página: nombre, URL, logo, imagen, teléfono, email, City Bell, provincia de Buenos Aires, país y redes sociales. La definición del tipo puede consultarse en [Schema.org](https://schema.org/InsuranceAgency). No contiene calificaciones ni horarios supuestos y no implica que Google vaya a mostrar un resultado enriquecido.

La FAQ sigue siendo contenido visible e interactivo. No se agregó marcado `FAQPage`: Google documenta la retirada de esa función de resultados enriquecidos en sus [actualizaciones de junio de 2026](https://developers.google.com/search/updates#june-2026).

`404.html` conserva el tema elegido, tiene `noindex`, enlaces táctiles de al menos 44 px y permite regresar al inicio o consultar por WhatsApp. El servidor local devuelve esta página con estado HTTP 404 para rutas inexistentes y mantiene el bloqueo de archivos internos. GitHub Pages puede usar el mismo archivo al publicar.

## Validación

- `node scripts/check-landing.mjs`: navegación animada, estructura, CTA, seis FAQ, metadatos, formulario interceptado y ausencia de desbordes en 1440, 1024, 768, 390 y 320 px.
- `node scripts/check-mobile-hero.mjs`: portada móvil, CTA visible y comportamiento del chat en escritorio.
- `node scripts/check-theme-reveals.mjs`: persistencia del tema, entradas y hover en claro y oscuro.
- `node scripts/check-faq.mjs`: apertura y cierre de preguntas frecuentes.
- `node scripts/check-original-motion.mjs`: entradas completas de 750 ms, curva y desplazamientos aprobados, contador de experiencia y ausencia de errores JavaScript.
- `node scripts/audit-unslop.mjs`, con salida en `artifacts/landing-design`: 24 capturas de secciones en escritorio claro, laptop oscuro y móvil claro; sin desbordes ni errores JavaScript.
- Comprobación adicional de 404 en 1440, 390 y 320 px: estado HTTP, tema, `noindex`, tamaños táctiles, ausencia de desborde y regreso al inicio. Las rutas `/.git/config` y `/scripts/preview.py` devuelven 404 sin contenido interno.

Las pruebas del formulario simulan las respuestas de Formspree; no enviaron emails reales ni acreditan su entrega. Las fuentes de Google no estuvieron accesibles desde este entorno: las capturas usan la tipografía de respaldo. La declaración de Raleway y Open Sans se conserva en el sitio.

Capturas locales: `artifacts/landing-design/` (ignorado por Git). Vista local: http://localhost:4173.

## Atribución

Skill landing-page-design: Copyright (c) 2026 Elaya, licencia MIT. Se incluye el texto completo en [landing-page-design-MIT.txt](../licenses/landing-page-design-MIT.txt).
