namespace UNAH_Reportes_API.DTOs
{
    public class UsuarioAdministracionDTO
    {
        public int IdUsuario { get; set; }
        public string CorreoInstitucional { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public int? IdCarrera { get; set; }
        public string? Carrera { get; set; }
        public int IdRol { get; set; }
        public string Rol { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; }
    }
}
