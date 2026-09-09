using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class CarreraGuardarDTO
    {
        [Required(ErrorMessage = "El nombre de la carrera es obligatorio.")]
        [StringLength(150, ErrorMessage = "El nombre no puede superar los 150 caracteres.")]
        public string NombreCarrera { get; set; } = string.Empty;
    }
}
