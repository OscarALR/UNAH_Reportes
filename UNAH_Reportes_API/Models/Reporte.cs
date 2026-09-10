using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.Models
{
    public class Reporte
    {
        [Key]
        public int IdReporte { get; set; }
        public int IdUsuario { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public int IdCategoria { get; set; }
        public int IdEspacio { get; set; }
        public int IdEstadoActual { get; set; }
        public int? IdGestorAsignado { get; set; }
        public string Prioridad { get; set; } = "Media";
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaUltimaActualizacion { get; set; } = DateTime.Now;
        public bool Eliminado { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string? MotivoEliminacion { get; set; }
        public int? IdUsuarioEliminacion { get; set; }

        public Usuario Usuario { get; set; } = null!;
        public Categoria Categoria { get; set; } = null!;
        public Espacio Espacio { get; set; } = null!;
        public Estado EstadoActual { get; set; } = null!;
        public Usuario? GestorAsignado { get; set; }
        public Usuario? UsuarioEliminacion { get; set; }

        public ICollection<HistorialEstado> HistorialEstados { get; set; } = new List<HistorialEstado>();
        public ICollection<ReporteImagen> Imagenes { get; set; } = new List<ReporteImagen>();
        public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
        public ICollection<Notificacion> Notificaciones { get; set; } = new List<Notificacion>();
        public ICollection<ReporteLike> Likes { get; set; } = new List<ReporteLike>();
        
    }
}
