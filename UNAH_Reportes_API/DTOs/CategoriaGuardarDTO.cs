using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class CategoriaGuardarDTO
    {
        [Required(ErrorMessage = "El nombre de la categoría es obligatorio.")]
        [StringLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
        public string NombreCategoria { get; set; } = string.Empty;
    }
}
