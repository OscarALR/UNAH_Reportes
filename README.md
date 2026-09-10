# RiUVS | UNAH Reportes

Plataforma web para registrar, consultar y dar seguimiento a incidencias en la Universidad Nacional Autónoma de Honduras – Valle de Sula (UNAH-VS).

Los usuarios pueden crear reportes con fotografías, consultar su avance y apoyar incidencias de la comunidad. Los gestores y administradores cuentan con herramientas para asignar, actualizar y analizar los reportes.

## Funcionalidades

- Registro e inicio de sesión con Microsoft Entra ID y cuentas locales.
- Creación de reportes con categoría, ubicación, prioridad y fotografías.
- Feed con búsqueda, filtros y reacciones.
- Comentarios, respuestas y seguimiento de estados.
- Gestión de reportes para gestores y administradores.
- Panel de indicadores y tendencia de incidencias.
- Administración de usuarios, categorías, carreras, edificios, espacios, estados y tipos de espacio.
- Notificaciones y archivo lógico de reportes.

## Arquitectura

| Componente | Tecnología |
| --- | --- |
| Frontend | React 18, Vite, React Router y Axios |
| API | ASP.NET Core 8, Entity Framework Core y Microsoft Identity Web |
| Base de datos | Azure SQL Database / SQL Server |
| Archivos | Azure Blob Storage |
| Despliegue | Azure Static Web Apps y Azure App Service |
| Automatización | GitHub Actions |

## Estructura del repositorio

```text
UNAH_Reportes_Web/   # Aplicación React
UNAH_Reportes_API/   # API ASP.NET Core
DatabaseScripts/     # Scripts de base de datos, en orden cronológico
.github/workflows/   # Flujos de compilación y despliegue
```

## Ejecución local

### 1. Base de datos

Configura una instancia de SQL Server y ejecuta los scripts de `DatabaseScripts` en orden cronológico. Define la cadena de conexión de la API mediante `ConnectionStrings__DefaultConnection`.

### 2. API

Requisitos: .NET SDK 8.

```powershell
cd UNAH_Reportes_API
dotnet restore
dotnet run --launch-profile https
```

La API usa configuración por secretos de usuario o variables de entorno. Como mínimo, configura:

```text
ConnectionStrings__DefaultConnection
Cors__AllowedOrigins
BlobStorage__ConnectionString
BlobStorage__ContainerName
LocalJwt__Issuer
LocalJwt__Audience
LocalJwt__SigningKey
AzureAd__TenantId
AzureAd__ClientId
```

### 3. Frontend

Requisitos: Node.js y pnpm.

```powershell
cd UNAH_Reportes_Web
pnpm install
pnpm dev
```

Para desarrollo, crea `UNAH_Reportes_Web/.env.local` con la URL de la API:

```dotenv
VITE_API_URL=https://localhost:7146/api
```

Para validar el build de producción:

```powershell
pnpm lint
pnpm build
```

## Despliegue en Azure

El proyecto incluye flujos de GitHub Actions para publicar la API en Azure App Service y el frontend en Azure Static Web Apps al hacer push a `main`.

Antes de publicar, verifica en la configuración de App Service:

- Las variables de entorno de la API indicadas arriba, sin valores de desarrollo.
- `Cors__AllowedOrigins` con la URL exacta de Azure Static Web Apps.
- Las credenciales y el nombre del contenedor de Azure Blob Storage.
- Que `DemoUser__Enabled` no esté activado en producción.
- Los URI de redirección de Microsoft Entra ID para el dominio público del frontend.

## Seguridad

- No publiques cadenas de conexión, claves de Blob Storage, claves JWT, contraseñas ni secretos de GitHub Actions.
- Usa secretos de usuario para desarrollo y **Configuration** de Azure App Service para producción.
- Los archivos `.env.local`, `appsettings.Development.json` y `appsettings.Production.json` están excluidos del repositorio.
- El frontend contiene únicamente `VITE_API_URL`; nunca coloques secretos en variables `VITE_*`, pues se incluyen en el navegador.

## Licencia

Proyecto académico desarrollado para UNAH-VS. Define una licencia antes de aceptar contribuciones externas.
