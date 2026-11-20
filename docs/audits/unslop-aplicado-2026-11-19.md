# Pulido Unslop aplicado — Marco Iglesias Seguros

19 de noviembre de 2026. Implementación autorizada sobre `feature/template-dewi`, a partir de la [auditoría](unslop-2026-11-19.md).

## Dirección conservada

Broker de seguros cercano, sereno y responsable. Se mantienen la familia, la identidad azul y dorada, los degradés de ambos temas, el contenido recuperado de Nosotros y ¿Por qué elegirnos?, los CTA de WhatsApp y el chat de siete consultas.

## Cambios por pasada

| Pasada | Resultado |
| --- | --- |
| 1. Espaciado | Separación de Nosotros a 80 px; interiores de planes a 24 px y de razones/servicios a 32 px. Las tarjetas mantienen su estructura y alturas de fila. |
| 2. Color | Tres roles de texto compartidos por tema: principal, secundario y metadatos. Se preservan los degradés y acentos aprobados. |
| 3. Iconos | FAQ y controles funcionales usan Bootstrap Icons; las redes conservan sus marcas y colores. |
| 4. Texto | Correcciones de tildes, concordancia y expresiones poco naturales en FAQ e inmuebles. Se reemplazan “mejores”, “exclusivos” y “novedades” por descripciones concretas en servicios y personales. La cuarta tarjeta explica el asesoramiento y enlaza a Contacto. La ayuda del formulario habla del mensaje y su límite, manteniendo la validación existente. |
| 5. Tipografía | Títulos en Raleway y lectura/controles en Open Sans; se retira Poppins. Se conserva el tamaño de la portada y su peso fuerte, con tracking de −0,03 em. Los seis títulos de sección pasan a `h2`; sus etiquetas son `span`. Las tarjetas de razones y servicios pasan a `h3`, y la bajada de portada es un párrafo. |
| 6. Layout | “Volver arriba” pasa abajo a la izquierda, con 44 × 44 px y margen seguro; se oculta temporalmente si un título cruza su posición. El footer reserva espacio inferior para los controles. Se conservan los encuadres de familia de cada tamaño de pantalla. |
| 7. Detalles | Metadatos y ayudas suben a 12 px; las etiquetas reducen tracking a 0,04 em. Se retiran las hojas de estilos sin uso de AOS, GLightbox y Remixicon de esta página. |
| 8. Visuales | La misma fotografía se exporta a WebP para escritorio y móvil, con precarga condicional y una sola descarga por navegación comprobada. El PNG original queda como fuente. |
| 9. Movimiento | Entradas de 500 ms, 24 px en escritorio y 16 px en móvil; zoom de .96/.98 y demoras máximas de 150 ms, sin demora en móvil. El celular y su control animan `transform`, conservando los 48 px visibles. El hover de planes tiene un recorrido pequeño y una curva gradual. Se mantienen el fade del header, el chat, la banda de compañías y la navegación animada. |

## Imagen de portada

| Versión | Dimensiones | Bytes | Reducción del archivo |
| --- | --- | ---: | ---: |
| PNG original | 6000 × 2388 | 17.748.630 | — |
| Escritorio WebP | 3200 × 1274 | 269.660 | 98,48 % |
| Móvil WebP | 2000 × 796 | 124.780 | 99,30 % |

Las solicitudes del navegador verificadas usan solo el WebP correspondiente al viewport, sin descargar el PNG. La comprobación del loader reutiliza la precarga ya finalizada para evitar una segunda solicitud en el servidor local con caché deshabilitada. La comparación de bytes no representa una medición de tiempo de carga en una red móvil.

Para regenerar las imágenes: `python scripts/optimize-hero.py` con Pillow instalado. Se revisó visualmente que la conversión conserve la escena y sus encuadres.

## Verificación

- `check-landing.mjs`: cinco tamaños de pantalla, títulos semánticos, imágenes comprimidas, navegación, FAQ, ausencia de desbordamiento y superposición del control con el título de Contacto. Envíos de formulario interceptados: éxito, duplicados, errores del proveedor, límites y respuestas inesperadas.
- `check-mobile-hero.mjs`: seis tamaños, incluido 320 × 568; CTA visible, celular oculto en móvil y secuencia detenida al cambiar a pantalla pequeña.
- `check-chat.mjs`: rotación natural, pausa de cinco segundos, ocultamiento y recuperación por teclado, conservación del tema y detención fuera de pantalla.
- `check-refinement.mjs`: salida del loader con recurso bloqueado, alineación de contacto, contraste del CTA, desplegables y entradas inválidas del formulario.
- `check-faq.mjs`, `check-original-motion.mjs`, `check-theme-reveals.mjs`: acordeones, nuevas entradas, hover y persistencia del tema.
- Capturas en [unslop-after](../../artifacts/unslop-after/) para 1440 claro, 1024 oscuro y 390 claro. Las capturas [anteriores](../../artifacts/unslop-audit/) se conservan. Las mediciones posteriores confirman 21 colores de texto computados en claro y 27 en oscuro, frente a 23 y 31 antes; el inventario incluye controles y enlaces.
- Comprobación de sintaxis JavaScript y `git diff --check` sin errores.
- Comprobación adicional en 1024 y 390 px: el control inferior se oculta cuando un título cruza su posición y reaparece al quedar despejada. Capturas `heading-safe-*` en la carpeta posterior.

Las fuentes web siguen usando Google Fonts. Como ese servicio no es accesible desde este entorno, las capturas usan fuentes de reserva; se conserva el peso aprobado de portada y queda documentada esa limitación de la comparación tipográfica. No se realizaron envíos de correo reales.

## Ajuste de ritmo solicitado después del pulido

El usuario pidió que todas las animaciones y el desplazamiento sean más pausados. Las entradas pasan a 750 ms, con una curva de aceleración gradual; las demoras llegan a 200 ms. La navegación dura entre 950 y 1800 ms y usa interpolación senoidal. El header transiciona durante 900 ms y el celular se desliza durante 800 ms. Las transiciones de tarjetas y botones duran aproximadamente 350–500 ms y el zoom de las fotos de planes, 800 ms.

La banda de compañías completa su recorrido en 44 segundos. Los mensajes del chat entran en 520 ms, con una secuencia más espaciada; se preservan cinco segundos completos de lectura al terminar la última entrada. Los acordeones también abren y cierran más lentamente. Los controles siguen siendo cancelables y responden a nuevas interacciones durante las transiciones.

## Atribución

Criterios de **Unslop**, por **Damir Sokolovsky / @heydamir**, licencia **CC BY 4.0**. Skill local: `D:/Visual studio Workspace/altoque/.agents/skills/unslop/SKILL.md`. Adaptada a las decisiones explícitas del titular sobre fotografía, degradés y movimiento.
