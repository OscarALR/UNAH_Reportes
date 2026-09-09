namespace UNAH_Reportes_API.Models
{
    public class CategoriaCarrera
    {
        public int IdCategoria { get; set; }
        public int IdCarrera { get; set; }

        public Categoria Categoria { get; set; } = null!;
        public Carrera Carrera { get; set; } = null!;
    }
}
