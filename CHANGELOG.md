# Cambios

Cada versión de faclab-web y lo que trae, la más reciente arriba. Sigue
[versionado semántico](https://semver.org/lang/es/): mientras empiece por 0 (hasta el piloto), una
versión menor puede romper la compatibilidad. `scripts/release.sh` escribe cada sección a partir de
los commits convencionales de `master` (README, "Versiones y publicación").

Si una versión necesita una versión mínima de faclab-core o de faclab-invoicing, su sección lo dice
en una línea **Requiere**, y la
[matriz de compatibilidad](https://github.com/faclab-ec/faclab-infra/blob/master/deploy/production/COMPATIBILITY.md)
también.

## [0.1.0] - 2026-11-22

Primera versión etiquetada: todo lo construido hasta la entrega continua (S8.2). La historia anterior
está en el historial de Git. `package.json` decía 2.0.1, una versión que nunca se publicó.

- **Requiere:** faclab-core 0.1.0 y faclab-invoicing 0.1.0.
