namespace UNAH_Reportes_API.Models;

public class ComentarioLike
{
    public int IdComentario { get; set; }
    public int IdUsuario { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public Comentario Comentario { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
}
