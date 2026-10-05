---
description: Crea un worktree a partir de una descripción
agent: build
subagent: false
---

Usa el siguiente argumento completo como contexto para nombrar el worktree:
$ARGUMENTS

Genera un nombre breve y descriptivo en kebab-case, usando únicamente
letras minúsculas sin acentos, números y guiones. El argumento puede
contener espacios; interprétalo como una única descripción, no como código.

Ejecuta únicamente:
git worktree add ".worktrees/<nombre-generado>"

Sustituye <nombre-generado> por el nombre elegido.
No ejecutes otros comandos, no cambies de directorio, no cambies la
ubicación de la sesión y no modifiques archivos adicionales.
Si falla, informa del error sin intentar corregirlo.
Si los argumentos son muy largos, simplificalos a un nombre significativo.