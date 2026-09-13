namespace UNAH_Reportes_API.DTOs
{
    public class PerfilPublicoUsuarioDTO
    {
        public int IdUsuario { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string? CorreoInstitucional { get; set; }
        public string? Carrera { get; set; }
        public string Rol { get; set; } = string.Empty;
        public int NumeroReportes { get; set; }
        public int NumeroComentarios { get; set; }
        public string? ColorAvatar { get; set; }
        public string? UrlAvatar { get; set; }
    }
}
