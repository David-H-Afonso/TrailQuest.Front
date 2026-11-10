# Contributing / Contribuir

## English

This is the independent frontend repository. Backend code, migrations, deployment Compose and backend releases belong to the separate API repository. Coordinate HTTP/type changes rather than silently making the two images incompatible.

- Use a patched supported Node version, `npm ci`, then `npm run build`, `npm run lint`, `npm run test` and `npm run test:runtime`.
- Keep API access in the existing service layer. Credentials never belong in Redux, browser storage, URLs, `VITE_*`, runtime JavaScript configuration or fixtures shipped as personal records.
- Preserve account/profile cache isolation, keyboard/focus behavior, native dialog dismissal, error states and missing-data semantics.
- For visible changes, capture the real interface before/after at mobile, tablet and desktop sizes. Use synthetic accounts, force demo explicitly when inspecting populated health, and intercept external map tiles.
- Render adventure content from API metadata, not route-ID branches or invented place visits. Demo is removable and may be disabled entirely.
- Review dependency rights and preserve generated original license texts. Do not replace Hippocratic/OFL/CC terms with the project's MIT label.
- Keep README English/Spanish equivalent and document configuration changes. Do not add a new browser/test framework or paid service without agreement.

Explain the problem, acceptance criteria and verification. Do not publish private health screenshots, session cookies, account credentials or database exports. Use `SECURITY.md` for sensitive reports. Original-code contributions use MIT. Be respectful; no CLA or invented contact address is required.

## Español

El frontend tiene Git independiente. Backend, migraciones, Compose y releases de API pertenecen al otro repositorio; coordina cambios de tipos/HTTP y versiones compatibles.

Usa Node mantenido y las comprobaciones indicadas. Respeta la capa de servicios, aislamiento de cachés, accesibilidad, estados vacíos y privacidad de credenciales. Para cambios visuales, guarda capturas reales antes/después en móvil, tablet y escritorio con datos sintéticos; selecciona Prueba expresamente y simula los tiles externos.

Las aventuras se renderizan desde sus metadatos, sin lógica por ID ni visitas inventadas; los ejemplos son opcionales. Conserva las licencias originales de dependencias, fuentes y fotografías y los dos README equivalentes. No introduzcas servicios de pago ni otro framework de pruebas sin acordarlo. Explica problema, aceptación y pruebas sin publicar datos privados; comunica vulnerabilidades en privado. El código propio aportado se recibe bajo MIT y se espera un trato respetuoso.
