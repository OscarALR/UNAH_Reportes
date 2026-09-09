using System.ComponentModel.DataAnnotations;
namespace UNAH_Reportes_API.Models
{
    public class Rol
    {
        [Key]
        public int IdRol { get; set; }
        public string NombreRol { get; set; } = string.Empty;
    }
}
