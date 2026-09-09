using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.Models
{
    public class Estado
    {
        [Key]
        public int IdEstado { get; set; }
        public string NombreEstado { get; set; } = string.Empty;
    }
}
