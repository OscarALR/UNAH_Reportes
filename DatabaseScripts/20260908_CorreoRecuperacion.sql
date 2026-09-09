/* Correo real para recuperar el acceso de cuentas locales. */
IF COL_LENGTH('dbo.Usuarios', 'CorreoRecuperacion') IS NULL
    ALTER TABLE dbo.Usuarios ADD CorreoRecuperacion NVARCHAR(150) NULL;
