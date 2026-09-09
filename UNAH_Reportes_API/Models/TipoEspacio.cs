using System.ComponentModel.DataAnnotations;
namespace UNAH_Reportes_API.Models
{
    public class TipoEspacio
    {
        [Key]
        public int IdTipoEspacio { get; set; }
        public string NombreTipo { get; set; } = string.Empty;
    }
}
