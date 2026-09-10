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
        public DateTime FechaComentario { get; set; } = DateTime.UtcNow;
        public int? IdComentarioPadre { get; set; }

        public Reporte Reporte { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
        public Comentario? ComentarioPadre { get; set; }
        public ICollection<Comentario> Respuestas { get; set; } = new List<Comentario>();
        public ICollection<ComentarioLike> Likes { get; set; } = new List<ComentarioLike>();
    }
}
