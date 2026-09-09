using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class EdificioGuardarDTO
    {
        [Required(ErrorMessage = "El nombre del edificio es obligatorio.")]
        [StringLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
        public string NombreEdificio { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "La descripción no puede superar los 255 caracteres.")]
        public string? Descripcion { get; set; }
    }
}
