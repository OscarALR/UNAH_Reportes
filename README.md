# Reporte de Incidencias UNAH VS
<img width="2044" height="916" alt="imgriuvs" src="https://github.com/user-attachments/assets/d60cde3f-0fba-4e1e-9e42-542151757c8f" />

Plataforma web para registrar, consultar y dar seguimiento a incidencias en la Universidad Nacional Autónoma de Honduras en el Valle de Sula (UNAH-VS).

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
<img width="2019" height="992" alt="image" src="https://github.com/user-attachments/assets/e25dd83a-c923-4fe8-b049-e60b1465c010" />


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

## Autoría
<img width="1992" height="1066" alt="image" src="https://github.com/user-attachments/assets/150a8157-595a-46ea-a1ba-547c622bed79" />

Para acceder directamente al sitio web, el enlace es el siguiente: https://witty-mushroom-0b9725c10.3.azurestaticapps.net/

Correo electrónico de prueba como Estudiante: usuario.prueba@unah.hn
Contraseña: @pruebariuvs26

Al principio suele mostrar un mensaje expresando que "el servicio se está cargando", esto es debido a las limitancias que impone el plan de suscripción básico de Microsoft Azure al cual estoy suscrito, recomiendo esperar alrededor de 30 segundos para acceder ya sea mediante una cuenta de Microsoft personal (No de escuela/universitaria o empresarial) o usando/creando una cuenta local.

Para mayor información, comunicate a oalopezr5@gmail.com

Proyecto académico desarrollado por [OscarALR](https://github.com/OscarALR) de índole personal.
