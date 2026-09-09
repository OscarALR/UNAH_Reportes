using System.ComponentModel.DataAnnotations;
namespace UNAH_Reportes_API.Models
{
    public class ReporteImagen
    {
        [Key]
        public int IdImagen { get; set; }
        public int IdReporte { get; set; }
        public string UrlAzureBlob { get; set; } = string.Empty;
        public DateTime FechaSubida { get; set; } = DateTime.Now;

        public Reporte Reporte { get; set; } = null!;
    }
}
