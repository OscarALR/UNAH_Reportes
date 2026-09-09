using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class TipoEspacioGuardarDTO
    {
        [Required(ErrorMessage = "El nombre del tipo de espacio es obligatorio.")]
        [StringLength(50, ErrorMessage = "El nombre no puede superar los 50 caracteres.")]
        public string NombreTipo { get; set; } = string.Empty;
    }
}
