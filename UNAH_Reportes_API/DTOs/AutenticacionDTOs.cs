using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class RegistroLocalDTO
    {
        [Required, EmailAddress, StringLength(150)] public string Correo { get; set; } = string.Empty;
        [Required, StringLength(150)] public string NombreCompleto { get; set; } = string.Empty;
        [Range(1, int.MaxValue)] public int IdCarrera { get; set; }
        [Required, StringLength(100, MinimumLength = 8)] public string Contrasena { get; set; } = string.Empty;
        [Required, EmailAddress, StringLength(150)] public string CorreoRecuperacion { get; set; } = string.Empty;
    }

    public class InicioSesionLocalDTO
    {
        [Required, EmailAddress] public string Correo { get; set; } = string.Empty;
        [Required] public string Contrasena { get; set; } = string.Empty;
    }

    public class SesionLocalDTO
    {
        public string Token { get; set; } = string.Empty;
        public UsuarioDTO Usuario { get; set; } = new();
    }

    public class PerfilActualizarDTO
    {
        [Required, StringLength(150)] public string NombreCompleto { get; set; } = string.Empty;
        [Range(1, int.MaxValue)] public int IdCarrera { get; set; }
        [EmailAddress, StringLength(150)] public string? CorreoRecuperacion { get; set; }
    }

    public class CambiarContrasenaDTO
    {
        [Required] public string ContrasenaActual { get; set; } = string.Empty;
        [Required, StringLength(100, MinimumLength = 8)] public string NuevaContrasena { get; set; } = string.Empty;
    }
}
