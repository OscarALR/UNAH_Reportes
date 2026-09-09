using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class EspacioGuardarDTO
    {
        [Required(ErrorMessage = "El nombre del espacio es obligatorio.")]
        [StringLength(150, ErrorMessage = "El nombre no puede superar los 150 caracteres.")]
        public string NombreEspacio { get; set; } = string.Empty;

        public int? IdEdificio { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Debes seleccionar un tipo de espacio válido.")]
        public int IdTipoEspacio { get; set; }
    }
}
