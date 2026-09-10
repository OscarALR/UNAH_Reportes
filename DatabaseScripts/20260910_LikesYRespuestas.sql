/* Ejecutar una sola vez antes de desplegar la API. */
IF COL_LENGTH('dbo.Comentarios', 'IdComentarioPadre') IS NULL
    ALTER TABLE dbo.Comentarios ADD IdComentarioPadre INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Comentarios_ComentarioPadre')
    ALTER TABLE dbo.Comentarios ADD CONSTRAINT FK_Comentarios_ComentarioPadre
        FOREIGN KEY (IdComentarioPadre) REFERENCES dbo.Comentarios(IdComentario);

IF OBJECT_ID('dbo.ReporteLikes', 'U') IS NULL
CREATE TABLE dbo.ReporteLikes (
    IdReporte INT NOT NULL,
    IdUsuario INT NOT NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_ReporteLikes_Fecha DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ReporteLikes PRIMARY KEY (IdReporte, IdUsuario),
    CONSTRAINT FK_ReporteLikes_Reporte FOREIGN KEY (IdReporte) REFERENCES dbo.Reportes(IdReporte),
    CONSTRAINT FK_ReporteLikes_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario)
);

IF OBJECT_ID('dbo.ComentarioLikes', 'U') IS NULL
CREATE TABLE dbo.ComentarioLikes (
    IdComentario INT NOT NULL,
    IdUsuario INT NOT NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_ComentarioLikes_Fecha DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ComentarioLikes PRIMARY KEY (IdComentario, IdUsuario),
    CONSTRAINT FK_ComentarioLikes_Comentario FOREIGN KEY (IdComentario) REFERENCES dbo.Comentarios(IdComentario),
    CONSTRAINT FK_ComentarioLikes_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario)
);
