namespace UNAH_Reportes_API.DTOs
{
    public class FeedReporteDTO
    {
        public int IdReporte { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string Espacio { get; set; } = string.Empty;
        public string Ubicacion { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string Prioridad { get; set; } = string.Empty;
        public string UsuarioReporta { get; set; } = string.Empty;
        public string CarreraUsuarioReporta { get; set; } = "Sin carrera asignada";
        public string? ImagenPortada { get; set; }
        public string? GestorAsignado { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int NumeroLikes { get; set; }
        public bool LeGustaUsuarioActual { get; set; }
        public bool EsDeMiCarrera { get; set; }
    }
}
