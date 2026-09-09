using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.Models
{
    public class Edificio
    {
        [Key]
        public int IdEdificio { get; set; }
        public string NombreEdificio { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }
}
