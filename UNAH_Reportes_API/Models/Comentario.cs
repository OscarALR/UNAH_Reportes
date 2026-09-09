using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.Models
{
    public class Comentario
    {
        [Key]
        public int IdComentario { get; set; }
        public int IdReporte { get; set; }
        public int IdUsuario { get; set; }
        public string Texto { get; set; } = string.Empty;
        public DateTime FechaComentario { get; set; } = DateTime.Now;

        public Reporte Reporte { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
