using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class ReporteCrearDTO
    {
        [Required, StringLength(150)]
        public string Titulo { get; set; } = string.Empty;

        [Required,StringLength(1000)]
        public string Descripcion { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int IdCategoria { get; set; }

        [Range(1, int.MaxValue)]
        public int IdEspacio { get; set; }

        [RegularExpression("^(Baja|Media|Alta)$")]
        public string Prioridad { get; set; } = "Media";
    }
}
