/*
  Ejecutar en la base de datos de UNAH_Reportes.
  Estas vistas son de solo lectura y no modifican las tablas operativas.
  Si tus estados finales tienen otros nombres, ajusta la lista en FechaResolucion.
*/

CREATE OR ALTER VIEW dbo.vw_PBI_Reportes
AS
SELECT
    r.IdReporte,
    r.Titulo,
    r.IdCategoria,
    c.NombreCategoria AS Categoria,
    r.IdEspacio,
    e.NombreEspacio AS Espacio,
    e.IdEdificio,
    COALESCE(ed.NombreEdificio, 'Área común') AS Edificio,
    e.IdTipoEspacio,
    te.NombreTipo AS TipoEspacio,
    r.IdEstadoActual,
    es.NombreEstado AS EstadoActual,
    r.Prioridad,
    r.IdUsuario AS IdUsuarioReportante,
    ur.NombreCompleto AS UsuarioReportante,
    ur.IdCarrera AS IdCarreraReportante,
    cr.NombreCarrera AS CarreraReportante,
    r.IdGestorAsignado,
    ug.NombreCompleto AS GestorAsignado,
    r.FechaCreacion,
    CAST(r.FechaCreacion AS date) AS FechaCreacionDia,
    r.FechaUltimaActualizacion,
    CAST(r.FechaUltimaActualizacion AS date) AS FechaUltimaActualizacionDia,
    resolucion.FechaResolucion
FROM dbo.Reportes r
INNER JOIN dbo.Categorias c ON c.IdCategoria = r.IdCategoria
INNER JOIN dbo.Espacios e ON e.IdEspacio = r.IdEspacio
LEFT JOIN dbo.Edificios ed ON ed.IdEdificio = e.IdEdificio
INNER JOIN dbo.TiposEspacio te ON te.IdTipoEspacio = e.IdTipoEspacio
INNER JOIN dbo.Estados es ON es.IdEstado = r.IdEstadoActual
INNER JOIN dbo.Usuarios ur ON ur.IdUsuario = r.IdUsuario
LEFT JOIN dbo.Carreras cr ON cr.IdCarrera = ur.IdCarrera
LEFT JOIN dbo.Usuarios ug ON ug.IdUsuario = r.IdGestorAsignado
OUTER APPLY (
    SELECT MIN(h.FechaCambio) AS FechaResolucion
    FROM dbo.HistorialEstados h
    INNER JOIN dbo.Estados estadoHistorial ON estadoHistorial.IdEstado = h.IdEstado
    WHERE h.IdReporte = r.IdReporte
      AND estadoHistorial.NombreEstado = 'Resuelto'
) resolucion;
GO

CREATE OR ALTER VIEW dbo.vw_PBI_HistorialEstados
AS
SELECT
    h.IdHistorial,
    h.IdReporte,
    h.IdEstado,
    e.NombreEstado AS Estado,
    h.IdUsuario AS IdUsuarioResponsable,
    u.NombreCompleto AS ResponsableCambio,
    h.FechaCambio,
    CAST(h.FechaCambio AS date) AS FechaCambioDia,
    h.Comentario
FROM dbo.HistorialEstados h
INNER JOIN dbo.Estados e ON e.IdEstado = h.IdEstado
INNER JOIN dbo.Usuarios u ON u.IdUsuario = h.IdUsuario;
GO
