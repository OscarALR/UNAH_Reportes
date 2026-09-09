using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class EstadoGuardarDTO
    {
        [Required(ErrorMessage = "El nombre del estado es obligatorio.")]
        [StringLength(50, ErrorMessage = "El nombre no puede superar los 50 caracteres.")]
        public string NombreEstado { get; set; } = string.Empty;
    }
}
