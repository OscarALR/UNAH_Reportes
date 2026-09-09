# UNAH Reportes API

API ASP.NET Core 8 para el sistema de incidencias de UNAH-VS.

## Requisitos locales

- .NET SDK 8.
- SQL Server Express disponible en `localhost\\SQLEXPRESS`, o una cadena de conexión equivalente en `ConnectionStrings__DefaultConnection`.
- Ejecuta los scripts de `../DatabaseScripts` en orden cronológico sobre la base `UNAH_Reportes` si aún no contienen esos cambios.
- Configura Azure Blob Storage para adjuntar imágenes mediante secretos de usuario:

```powershell
dotnet user-secrets set "AzureBlobStorage:ConnectionString" "<cadena de conexión>"
dotnet user-secrets set "AzureBlobStorage:ContainerName" "<contenedor>"
```

La autenticación local de desarrollo y el usuario de prueba se controlan desde `appsettings.Development.json`. No habilites `DemoUser:Enabled` ni conserves una clave JWT de desarrollo en producción.

## Ejecución

```powershell
dotnet run --launch-profile https
```

Swagger está disponible solo en el entorno Development.
