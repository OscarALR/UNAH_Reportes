/* Archivo lógico de reportes: conserva la trazabilidad y evita borrar evidencia. */
IF COL_LENGTH('dbo.Reportes', 'Eliminado') IS NULL
    ALTER TABLE dbo.Reportes ADD Eliminado BIT NOT NULL CONSTRAINT DF_Reportes_Eliminado DEFAULT 0;

IF COL_LENGTH('dbo.Reportes', 'FechaEliminacion') IS NULL
    ALTER TABLE dbo.Reportes ADD FechaEliminacion DATETIME NULL;

IF COL_LENGTH('dbo.Reportes', 'MotivoEliminacion') IS NULL
    ALTER TABLE dbo.Reportes ADD MotivoEliminacion NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.Reportes', 'IdUsuarioEliminacion') IS NULL
BEGIN
    ALTER TABLE dbo.Reportes ADD IdUsuarioEliminacion INT NULL;
    ALTER TABLE dbo.Reportes ADD CONSTRAINT FK_Reportes_UsuarioEliminacion
        FOREIGN KEY (IdUsuarioEliminacion) REFERENCES dbo.Usuarios(IdUsuario);
END;
