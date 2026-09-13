namespace UNAH_Reportes_API.DTOs
{
    public class UsuarioDTO
    {
        public int IdUsuario { get; set; }
        public string CorreoInstitucional { get; set; } = string.Empty;
        public string NombreCompleto {  get; set; } = string.Empty;
        public string? Carrera { get; set; }
        public string Rol { get; set; } = string.Empty;
        public string TipoAutenticacion { get; set; } = string.Empty;
        public string? CorreoRecuperacion { get; set; }
        public string? ColorAvatar { get; set; }
        public string? UrlAvatar { get; set; }
    }
}
