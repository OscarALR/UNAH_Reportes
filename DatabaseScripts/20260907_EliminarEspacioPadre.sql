/*
  Elimina la jerarquía de espacios.
  Advertencia: al quitar IdEspacioPadre se descartan las relaciones padre-subespacio existentes.
*/
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Espacios_EspacioPadre'
      AND parent_object_id = OBJECT_ID('dbo.Espacios')
)
BEGIN
    ALTER TABLE dbo.Espacios DROP CONSTRAINT FK_Espacios_EspacioPadre;
END;

IF COL_LENGTH('dbo.Espacios', 'IdEspacioPadre') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Espacios DROP COLUMN IdEspacioPadre;
END;
