# Marco Iglesias Seguros

Landing estática de un broker de seguros. HTML, CSS y JavaScript, compatible con GitHub Pages; no requiere Node ni un proceso de compilación para publicarse.

## Vista local

Desde esta carpeta:

```powershell
python scripts/preview.py
```

Abrir http://localhost:4173. El servidor recarga la página al cambiar el HTML, los estilos o el JavaScript. Sirve los archivos públicos y bloquea el acceso a `.git`, scripts y otros archivos internos. Detenerlo con Ctrl+C.

## Archivos principales

- `index.html`: contenido, navegación, coberturas y formulario.
- `assets/css/style.css`: estilos de la plantilla original Dewi.
- `assets/css/refresh.css`: ajustes visuales, responsive, botones y animaciones.
- `assets/css/polish.css`: contraste, fotografía de portada y estados de interacción.
- `assets/css/chat-preview.css`: celular y conversación ilustrativa de la portada.
- `assets/css/theme.css`: variantes claras y oscuras y selector de tema.
- `assets/css/refinement.css`: jerarquía de marca, carga inicial, Nosotros, planes, contacto y footer único.
- `assets/js/site.js`: navegación móvil y envío del formulario.
- `CNAME`, `sitemap.xml`, `robots.txt`: dominio e indexación.

Se conserva la estructura original Dewi, con Bootstrap para el layout y las preguntas frecuentes. La sección de testimonios se retiró. La landing no carga Swiper, jQuery, AOS, los manejadores de scroll duplicados ni el validador PHP de la plantilla.

## Contacto

WhatsApp: `5491164221275`. Los enlaces incluyen mensajes según la cobertura consultada. Si cambia el número, actualizar sus apariciones en `index.html`.

Se conserva el endpoint de Formspree `https://formspree.io/f/mwkjzbya`. Validar su configuración y destinatario antes de publicar. Las pruebas locales interceptan el proveedor y no envían consultas reales. Sin JavaScript, el formulario usa el envío HTML normal al mismo endpoint.

El formulario solo muestra éxito si Formspree responde con un estado HTTP exitoso y `{ "ok": true }`. Conserva los datos si falla y distingue indisponibilidad, límites temporales y rechazo de datos. La aceptación por el proveedor no acredita la recepción en la casilla: se requiere verificar el panel de Formspree y la bandeja del destinatario. Las comprobaciones de conexión realizadas desde este entorno no obtuvieron respuesta del endpoint; no se enviaron consultas reales.

## Comprobación en navegador

El script reutiliza Puppeteer instalado en el proyecto local de referencia `../altoque/apps/web`:

```powershell
node scripts/check-landing.mjs
```

Permite configurar `FRONTEND_REFERENCE` (ruta a un `package.json` con Puppeteer instalado), `CHROME_EXECUTABLE` y `LANDING_URL`. Guarda capturas y resultados en `artifacts/`, ignorado por Git. Esta herramienta es opcional y no forma parte del sitio publicado.

## Diseño y movimiento

El selector de la cabecera alterna entre modo claro y oscuro. El modo claro es el predeterminado; la elección se guarda en `localStorage` con la clave `marco-theme` y se aplica antes de renderizar la página. Se puede verificar junto con las entradas de tarjetas usando `node scripts/check-theme-reveals.mjs`.

Los títulos y tarjetas de “Por qué elegirnos”, servicios y coberturas entran con fade y desplazamiento escalonado al aparecer en pantalla. Por pedido del titular, estas entradas también funcionan con movimiento reducido activo. Se reproducen una vez por carga de página; sin JavaScript el contenido permanece visible.

Se conserva el lenguaje de movimiento de la versión original: `fade-up` y `zoom-in`, con entradas de 750 ms y curva `cubic-bezier(.4,0,.2,1)`. El desplazamiento es de 24 px en escritorio y 16 px en móvil; el zoom parte de .96 y .98 respectivamente. Las demoras se limitan a 200 ms y se eliminan en móvil. El dato de 28 años conserva su contador de entrada, ahora de 1400 ms. Un único observador coordina las entradas, sin duplicar AOS ni los manejadores originales.

Las tarjetas de “Por qué elegirnos” y servicios toman un fondo celeste al pasar el cursor, con una variante azul para el tema oscuro. Las preguntas frecuentes abren y cierran con transición de altura y fade de texto, también con movimiento reducido activo. El footer conserva los datos y las redes de contacto, sin repetir las columnas de enlaces y servicios.

La portada ocupa como mínimo toda la altura de la pantalla. El celular alterna siete consultas de ejemplo: auto, hogar, bicicleta, embarcación, viaje, obra y comercio. Cada una tiene sus propios mensajes, indicador de escritura y cinco segundos de pausa después de terminar la última respuesta, antes de pasar al tema siguiente. El botón debajo del celular permite ocultarlo con un deslizamiento hacia la derecha. Quedan visibles 48 px y el mismo control permite mostrarlo de nuevo, también con teclado. La secuencia se detiene al ocultar el celular, fuera de pantalla o al ocultar la pestaña, y conserva el tema al regresar.

En pantallas de menos de 768 px, la portada muestra la foto de fondo, “Seguros con atención personal”, el título animado, la bajada explicativa y el CTA de WhatsApp. El celular queda oculto y no ejecuta su secuencia ni temporizadores. En pantallas amplias, el chat animado aparece en la esquina inferior derecha, con un tamaño menor en ventanas de poca altura. El botón flotante de WhatsApp se oculta mientras estamos en la portada y aparece al salir de ella.

La portada usa versiones WebP de la fotografía panorámica: `hero-desktop.webp` (3200 × 1274, 269.660 bytes) y `hero-mobile.webp` (2000 × 796, 124.780 bytes). El PNG original se conserva como fuente y no se descarga desde la landing. Los encuadres elegidos para móvil, laptop y escritorio se mantienen. Para regenerar los WebP, usar `python scripts/optimize-hero.py` con Pillow instalado. La cabecera compacta conserva su tinte semitransparente y un fade de 900 ms al salir de la portada.

Se incorporan botones para conocer los planes y consultar por WhatsApp. Los detalles de cobertura usan desplegables nativos con apertura animada. El bloque de texto de la portada entra completo con un fade y desplazamiento de 750 ms, sin tipeo. La navegación entre secciones dura entre 950 y 1800 ms según la distancia, con una curva senoidal que acelera y frena progresivamente. Por pedido del titular, estas entradas y los clics de navegación mantienen su animación incluso cuando el sistema informa movimiento reducido. El desplazamiento de navegación se puede cancelar con la rueda, el tacto o el teclado.

Los logos de las compañías se muestran más grandes, en una franja azul profunda, y se desplazan horizontalmente sin botón de pausa. El título entra suavemente al llegar a la sección. El movimiento se pausa al pasar el cursor sobre la banda y se detiene fuera de pantalla o al ocultar la pestaña. Planes, preguntas y razones para elegirnos usan fondos azulados suaves para separar el contenido. Por pedido del titular, esta banda se reproduce también con movimiento reducido activo. La entrada del texto de portada se repite al volver a Inicio. El lector de pantalla recibe siempre el título completo. Los formularios mantienen su envío HTML normal sin JavaScript.

Se conservaron la experiencia, las imágenes y compañías presentes en el contenido original. Confirmar su vigencia con el titular antes de publicar.

## Carga y formulario

La carga inicial muestra el logo y un spinner mientras se prepara la portada. La espera tiene un límite de 2200 ms y una salida de respaldo a los 3500 ms si falla el JavaScript principal. Sin JavaScript, la página se muestra directamente.

El formulario valida campos obligatorios y longitudes, permite únicamente los temas del selector y rechaza etiquetas HTML y caracteres de control. Admite nombres con acentos, guiones y apóstrofes. Solo se envían nombre, email, tema, mensaje y el campo antispam; las respuestas se muestran con `textContent`. Esta validación del navegador puede eludirse: Formspree debe aplicar sus propias restricciones y controles antispam. No se afirma protección del servidor ni entrega real del email sin verificar el proveedor.

`node scripts/check-refinement.mjs` comprueba la salida del spinner con una imagen bloqueada, cuatro combinaciones de pantalla y tema, la apertura animada de los planes y el rechazo de entradas inválidas. Intercepta los envíos; no manda emails reales.

## Pulido Unslop

La auditoría y su implementación se documentan en `docs/audits/`. Se conservan la identidad, los degradés, el chat, las compañías y el contenido aprobado de Nosotros y ¿Por qué elegirnos?. Los títulos de sección son `h2.section-heading`, precedidos por etiquetas `span.section-kicker`. Se usan Raleway para títulos y Open Sans para lectura y controles; se retiró la referencia accidental a Poppins. Las fuentes web todavía dependen de Google Fonts.

“Volver arriba” queda abajo a la izquierda, con un área de 44 × 44 px y margen para el área segura. Se oculta temporalmente si un título de sección cruza su posición, para mantenerlo legible. El footer reserva espacio para los controles flotantes. El celular se esconde y reaparece mediante `transform`, manteniendo los 48 px visibles y el control por teclado.

Los iconos funcionales usan Bootstrap Icons; las redes conservan Boxicons y sus colores. Se retiraron los estilos sin uso de AOS, GLightbox y Remixicon de la landing. Los archivos de la plantilla se mantienen en el repositorio.

Criterios de Unslop por Damir Sokolovsky / @heydamir, CC BY 4.0, adaptados a las decisiones de diseño del titular.

## Recorrido de consulta

Se aplicaron los criterios pertinentes de `landing-page-design`: WhatsApp como acción principal, experiencia visible en portada, proceso de consulta en tres pasos y una sexta pregunta frecuente sobre qué información preparar. El formulario de email conserva su función como alternativa de contacto. Se mantienen la identidad y las decisiones visuales aprobadas.

El título, la descripción y las etiquetas sociales comparten el mismo mensaje. Los datos estructurados `InsuranceAgency` contienen datos de contacto ya presentes en la página. `404.html` ofrece volver al inicio o consultar por WhatsApp, respeta el tema elegido y también se sirve localmente para rutas inexistentes.

Detalle de cambios, criterios y pruebas: [aplicación de landing-page-design](docs/audits/landing-page-design-2026-11-19.md). Atribución de la skill: Copyright (c) 2026 Elaya, [licencia MIT](docs/licenses/landing-page-design-MIT.txt).

La revisión posterior con `design-review` y `antislop-copywriting` ajustó contraste de etiquetas, áreas táctiles, nombres accesibles y copy de planes y contacto. Ver [hallazgos, cambios y validación](.ui-design/reviews/landing-2026-11-19.md). Los criterios de copy de antislop son de Miqdad Badjuber, [licencia MIT](docs/licenses/antislop-MIT.txt).

## Lectura en móvil

En menos de 768 px, Nosotros ofrece el desarrollo de experiencia y matrícula en «Conocé nuestra experiencia». Las descripciones de los planes se incluyen dentro de sus detalles, sin duplicarlas. El contenido vuelve a su presentación completa en escritorio; sin JavaScript, los textos permanecen disponibles. Las imágenes, tarjetas de razones y espacios entre secciones se compactan para reducir el recorrido vertical.

La portada ofrece «Conocé nuestros planes» en móviles de al menos 640 px de alto. En pantallas más bajas se prioriza el CTA de WhatsApp. El chat simulado continúa oculto en móvil. Fuera de la portada aparece el aviso de ayuda; el control de volver arriba se mantiene en escritorio. El menú abierto bloquea el scroll del fondo y permite recorrer sus controles con teclado y cerrarlo con Escape.

## Aviso de ayuda

El aviso reemplaza el botón redondo de WhatsApp. Entra suavemente al salir de la portada y muestra una insignia roja con «1», correspondiente a la invitación de ayuda. Tras cinco segundos visible aparece un segundo globito superpuesto, «Estoy para ayudarte», y el contador pasa a «2». La espera se cancela cuando el aviso no está visible, al ocultar la pestaña, minimizar o abrir el panel. Al abrir cualquiera se marca como leído y la insignia desaparece mientras se consulta el panel. Al cerrarlo se reinicia el ciclo completo: texto original, contador «1», animación y nueva espera de cinco segundos hasta el segundo mensaje y contador «2». La cruz del aviso permite minimizarlo a «¿Te ayudamos?»; abrir y cerrar la consulta vuelve a la presentación completa.

Abre un diálogo con un enlace a WhatsApp y tres respuestas rápidas tomadas de la FAQ principal, sin buscador. El aviso contrasta con el tema de la página: blanco en modo oscuro y azul oscuro en modo claro. El enlace inferior lleva a la sección completa mediante la navegación existente. No carga un proveedor de chat externo ni simula una conversación en vivo.

El diálogo mantiene superficies claras también sobre la página oscura. Las respuestas abren y cierran con una transición de altura de 600 ms y fade de texto; admiten invertir la animación con otro clic y cierran suavemente la respuesta anterior al abrir otra.

Cada aviso entra con desplazamiento y escala; al abrir la consulta, el panel entra durante 600 ms con fade, desplazamiento y escala. Por pedido del titular, estas entradas también se reproducen cuando el sistema informa movimiento reducido. Cada uno de los dos avisos puede reproducir una vez por ciclo un «pop» de 160 ms, sintetizado localmente con Web Audio y volumen bajo. El audio se prepara tras una interacción real; si el navegador lo bloquea o no está disponible, la interfaz sigue funcionando en silencio. No se descargan archivos de sonido.

`assets/css/support.css` y `assets/js/support.js` contienen su presentación y comportamiento. `node scripts/check-support.mjs` verifica seis combinaciones de pantalla y tema, contraste del aviso, insignia de lectura, desplegables, cierre, restauración del foco y navegación a FAQ. Las capturas se guardan en `artifacts/support/`. Los enlaces de WhatsApp se verifican sin enviar mensajes reales.

`node scripts/check-support-cycle.mjs` comprueba la repetición del ciclo en móvil oscuro y escritorio claro, incluida la pausa mientras el panel está abierto, el cierre por botón y Escape y la restauración después de minimizar.
