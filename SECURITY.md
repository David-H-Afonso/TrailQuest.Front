# Security policy / Política de seguridad

The 1.0 line is the current maintenance target. The frontend is not an authorization boundary: all account/profile/resource checks must remain enforced by the separate API. Remote use requires the configured HTTPS origin and a restricted trusted reverse proxy.

Report vulnerabilities through **GitHub private vulnerability reporting**, if enabled by the repository owner. Otherwise contact that owner privately through their published channel; do not publish exploit details or invent an email address. Before inviting reports, the owner must make this channel available.

Include versions, sanitized reproduction and impact. Never attach credentials, cookies, integration tokens, `.env`, real health screenshots, raw exports, keys or databases. Use synthetic fixtures. Do not scan unrelated applications or live map/provider infrastructure.

Secrets must not enter frontend bundles, public assets, `VITE_*`, runtime JavaScript config, Redux, localStorage or URLs. The app uses same-origin API requests and HttpOnly cookies. Keep origin validation, cache clearing, secure error handling, privacy defaults and original dependency notices intact. Do not fix mixed-content/proxy problems by disabling TLS checks or enabling wildcard CORS.

Container and API security details are in the backend's CasaOS guide. This policy does not promise a response-time SLA or certify the installation's security.

## Español

La línea 1.0 es el objetivo de mantenimiento. El frontend no sustituye la autorización del servidor: API debe validar cuentas, perfiles y recursos. El uso remoto requiere HTTPS y el proxy configurado.

Comunica vulnerabilidades por el canal privado de GitHub si está habilitado o contacta privadamente con el propietario por un canal publicado. No reveles explotación ni inventes correos; el propietario debe habilitar el canal antes de pedir informes. Envía versión, reproducción sintética e impacto, nunca claves, cookies, salud, `.env`, bases ni exportaciones privadas.

No pongas secretos en recursos públicos, `VITE_*`, JavaScript de configuración, Redux, localStorage ni URLs. Conserva validación de origen, aislamiento de caché, privacidad y avisos de dependencias. No soluciones fallos de proxy anulando TLS/CORS. Las condiciones del servidor están en la guía de CasaOS de la API; no se promete SLA ni certificación de seguridad.
