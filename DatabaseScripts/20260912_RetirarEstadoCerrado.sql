/*
  Retira el estado redundante "Cerrado" sin perder trazabilidad.
  Las referencias históricas y actuales se migran a "Resuelto" antes de borrar el catálogo.
  Ejecutar una sola vez en Azure SQL Database, después de confirmar un respaldo.
*/
SET XACT_ABORT ON;

DECLARE @IdEstadoCerrado INT = (
    SELECT IdEstado FROM dbo.Estados WHERE NombreEstado = N'Cerrado'
);

IF @IdEstadoCerrado IS NULL
BEGIN
    PRINT N'El estado "Cerrado" no existe. No hay cambios que aplicar.';
    RETURN;
END;

DECLARE @IdEstadoResuelto INT = (
    SELECT IdEstado FROM dbo.Estados WHERE NombreEstado = N'Resuelto'
);

IF @IdEstadoResuelto IS NULL
    THROW 51000, 'No existe el estado "Resuelto". Créalo antes de retirar "Cerrado".', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE dbo.Reportes
    SET IdEstadoActual = @IdEstadoResuelto,
        FechaUltimaActualizacion = SYSUTCDATETIME()
    WHERE IdEstadoActual = @IdEstadoCerrado;

    UPDATE dbo.HistorialEstados
    SET IdEstado = @IdEstadoResuelto
    WHERE IdEstado = @IdEstadoCerrado;

    DELETE FROM dbo.Estados
    WHERE IdEstado = @IdEstadoCerrado;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
