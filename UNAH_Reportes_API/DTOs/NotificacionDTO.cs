namespace UNAH_Reportes_API.DTOs
{
    public class NotificacionDTO
    {
        public int IdNotificacion {  get; set; }
        public int IdReporte { get; set; }
        public string? Tipo { get; set; }
        public string Mensaje { get; set; } = string.Empty;
        public bool Leida { get; set; }
        public DateTime FechaCreacion { get; set; }
    }
}
