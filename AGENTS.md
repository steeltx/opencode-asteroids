# Contexto del repositorio

- Juego estático sin dependencias, manifiesto npm ni bundler. Abre `index.html` directamente en el navegador; opcionalmente ejecuta `npx serve .` desde la raíz.
- `index.html` carga `game.js` como script clásico después del canvas. El script accede al DOM al cargarse e inicia el juego y el bucle `requestAnimationFrame` inmediatamente; no es un módulo importable en Node.
- Las dimensiones están duplicadas: canvas de 800×600 en `index.html` y constantes `W`/`H` en `game.js`. Mantén ambas sincronizadas si cambias el tamaño.
- `update(dt)` usa segundos y el bucle limita `dt` a 0.05. Movimiento y temporizadores usan `dt`, pero el arrastre de la nave se aplica por frame.
- `pressed(code)` consume la pulsación; Space dispara por pulsación, no continuamente al mantenerla, y reinicia tras game over. Las flechas usan el estado sostenido de `keys`.
- Las posiciones de nave, balas y asteroides envuelven los bordes, pero `dist()` calcula distancia euclídea sin envolvimiento; las colisiones no son toroidales.
- El README menciona power-ups y estrellas fugaces, pero no están implementados. Usa `game.js` como fuente de verdad para las mecánicas actuales.

# Verificación

- No hay suites de pruebas, lint, typecheck ni CI configurados. `node --check game.js` solo comprueba sintaxis; no ejecuta el juego.
- Para cambios de lógica o renderizado, verifica en navegador: rotación/propulsión, disparos, envolvimiento de bordes, fragmentación y puntuación, reaparición con invencibilidad, cambio de nivel y reinicio con Space tras game over. Comprueba también errores en la consola.
