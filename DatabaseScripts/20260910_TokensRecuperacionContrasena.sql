/* Tokens de un único uso para restablecer contraseñas de cuentas locales. */
IF OBJECT_ID('dbo.TokensRecuperacionContrasena', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TokensRecuperacionContrasena
    (
        IdTokenRecuperacion INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TokensRecuperacionContrasena PRIMARY KEY,
        IdUsuario INT NOT NULL,
        TokenHash CHAR(64) NOT NULL,
        CreadoEn DATETIME2 NOT NULL,
        ExpiraEn DATETIME2 NOT NULL,
        UsadoEn DATETIME2 NULL,
        CONSTRAINT FK_TokensRecuperacionContrasena_Usuarios FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(IdUsuario)
    );
    CREATE UNIQUE INDEX UX_TokensRecuperacionContrasena_TokenHash ON dbo.TokensRecuperacionContrasena(TokenHash);
    CREATE INDEX IX_TokensRecuperacionContrasena_Usuario_Expira ON dbo.TokensRecuperacionContrasena(IdUsuario, ExpiraEn);
END
