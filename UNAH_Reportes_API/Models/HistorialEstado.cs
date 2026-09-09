using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.Models
{
    public class HistorialEstado
    {
        [Key]
        public int IdHistorial {  get; set; }
        public int IdReporte { get; set; }
        public int IdEstado { get; set; }
        public int IdUsuario { get; set; }
        public string? Comentario { get; set; }
        public DateTime FechaCambio { get; set; } = DateTime.Now;

        public Reporte Reporte { get; set; } = null!;
        public Estado Estado { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
