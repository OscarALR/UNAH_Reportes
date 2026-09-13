using System.ComponentModel.DataAnnotations;
namespace UNAH_Reportes_API.Models
{
    public class Usuario
    {
        [Key]
        public int IdUsuario { get; set; }
        public string CorreoInstitucional { get; set; } = string.Empty;
        public string NombreCompleto {  get; set; } = string.Empty;
        public int? IdCarrera { get; set; }
        public int IdRol {  get; set; }
        public string Estado { get; set; } = "Activo";
        public DateTime FechaRegistro { get; set; } = DateTime.Now;
        public string TipoAutenticacion { get; set; } = "Microsoft";
        public string? PasswordHash { get; set; }
        public string? CorreoRecuperacion { get; set; }
        public string? ColorAvatar { get; set; }
        public string? UrlAvatar { get; set; }

        public Carrera? Carrera { get; set; }
        public Rol Rol { get; set; } = null!;
    }
}
