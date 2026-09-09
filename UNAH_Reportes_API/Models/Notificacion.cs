using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.Models
{
    public class Notificacion
    {
        [Key]
        public int IdNotificacion {  get; set; }
        public int IdUsuario { get; set; }
        public int IdReporte { get; set; }
        public string? Tipo { get; set; }
        public string Mensaje { get; set; } = string.Empty;
        public bool Leida { get; set; } = false;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        public Usuario Usuario { get; set; } = null!;
        public Reporte Reporte { get; set; } = null!;
    }
}
