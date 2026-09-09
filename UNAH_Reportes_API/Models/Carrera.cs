using System.ComponentModel.DataAnnotations;
namespace UNAH_Reportes_API.Models
{
    public class Carrera
    {
        [Key]
        public int IdCarrera { get; set; }
        public string NombreCarrera { get; set; } = string.Empty;
    }
}
