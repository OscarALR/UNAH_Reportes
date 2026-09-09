using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.Models
{
    public class Categoria
    {
        [Key]
        public int IdCategoria { get; set; }

        public string NombreCategoria { get; set; } = string.Empty;
    }
}
