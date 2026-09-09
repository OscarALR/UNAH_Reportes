/* Autenticación local. La contraseña se almacena únicamente como hash. */
IF COL_LENGTH('dbo.Usuarios', 'TipoAutenticacion') IS NULL
    ALTER TABLE dbo.Usuarios ADD TipoAutenticacion NVARCHAR(20) NOT NULL CONSTRAINT DF_Usuarios_TipoAutenticacion DEFAULT 'Microsoft';

IF COL_LENGTH('dbo.Usuarios', 'PasswordHash') IS NULL
    ALTER TABLE dbo.Usuarios ADD PasswordHash NVARCHAR(500) NULL;
