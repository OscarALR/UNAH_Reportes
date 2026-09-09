using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class ArchivarReporteDTO
    {
        [Required(ErrorMessage = "Debes indicar el motivo de archivo.")]
        [StringLength(500, ErrorMessage = "El motivo no puede superar los 500 caracteres.")]
        public string Motivo { get; set; } = string.Empty;
    }
}
