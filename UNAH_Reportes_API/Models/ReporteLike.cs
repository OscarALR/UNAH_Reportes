namespace UNAH_Reportes_API.Models;

public class ReporteLike
{
    public int IdReporte { get; set; }
    public int IdUsuario { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public Reporte Reporte { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
}
