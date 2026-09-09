namespace UNAH_Reportes_API.DTOs
{
    public class HistorialEstadoDTO
    {
        public int IdHistorial {  get; set; }
        public string Estado { get; set; } = string.Empty;
        public string Usuario {  get; set; } = string.Empty;
        public string? Comentario {  get; set; }
        public DateTime FechaCambio { get; set; }
    }
}
