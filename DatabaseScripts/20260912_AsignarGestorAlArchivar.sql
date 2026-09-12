/*
  Corrige reportes archivados antes de esta regla.
  Solo asigna quien archivó cuando el reporte no tenía gestor asignado.
*/
UPDATE dbo.Reportes
SET IdGestorAsignado = IdUsuarioEliminacion,
    FechaUltimaActualizacion = SYSUTCDATETIME()
WHERE Eliminado = 1
  AND IdGestorAsignado IS NULL
  AND IdUsuarioEliminacion IS NOT NULL;
