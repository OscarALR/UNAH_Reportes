/* Comentarios eliminados lógicamente y personalización de avatar. */
IF COL_LENGTH('dbo.Comentarios', 'Eliminado') IS NULL
    ALTER TABLE dbo.Comentarios ADD Eliminado BIT NOT NULL CONSTRAINT DF_Comentarios_Eliminado DEFAULT 0;

IF COL_LENGTH('dbo.Comentarios', 'FechaEliminacion') IS NULL
    ALTER TABLE dbo.Comentarios ADD FechaEliminacion DATETIME2 NULL;

IF COL_LENGTH('dbo.Comentarios', 'IdUsuarioEliminacion') IS NULL
BEGIN
    ALTER TABLE dbo.Comentarios ADD IdUsuarioEliminacion INT NULL;
    ALTER TABLE dbo.Comentarios ADD CONSTRAINT FK_Comentarios_UsuarioEliminacion
        FOREIGN KEY (IdUsuarioEliminacion) REFERENCES dbo.Usuarios(IdUsuario);
END;

IF COL_LENGTH('dbo.Usuarios', 'ColorAvatar') IS NULL
    ALTER TABLE dbo.Usuarios ADD ColorAvatar VARCHAR(7) NULL;

IF COL_LENGTH('dbo.Usuarios', 'UrlAvatar') IS NULL
    ALTER TABLE dbo.Usuarios ADD UrlAvatar NVARCHAR(2048) NULL;
