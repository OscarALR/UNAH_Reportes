# UNAH Reportes Web

Frontend en React y Vite para el sistema de incidencias de UNAH-VS.

## Requisitos y ejecución

1. Inicia la API en `UNAH_Reportes_API`.
2. Configura opcionalmente `VITE_API_URL` en un archivo `.env.local`. El valor local predeterminado es `https://localhost:7146/api`.
3. Ejecuta `pnpm install` y luego `pnpm dev`.

Para generar la versión de producción, usa `pnpm build`. Antes de desplegar, configura `VITE_API_URL` con la URL pública de la API, incluyendo `/api`.
