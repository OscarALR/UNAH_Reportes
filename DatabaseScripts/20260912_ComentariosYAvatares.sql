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

/* Normaliza colores existentes que no garantizan contraste con las iniciales blancas. */
UPDATE dbo.Usuarios
SET ColorAvatar = '#1F6F8B'
WHERE ColorAvatar IS NOT NULL
  AND UPPER(ColorAvatar) NOT IN ('#1F6F8B', '#1E8449', '#6C3483', '#7B241C', '#7D6608', '#2C3E50', '#117864', '#AF601A');
