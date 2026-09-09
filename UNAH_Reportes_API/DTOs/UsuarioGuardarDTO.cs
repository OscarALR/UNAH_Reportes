using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.DTOs
{
    public class UsuarioGuardarDTO
    {
        [Required(ErrorMessage = "El correo institucional es obligatorio.")]
        [EmailAddress(ErrorMessage = "Debes ingresar un correo válido.")]
        [StringLength(150, ErrorMessage = "El correo no puede superar los 150 caracteres.")]
        public string CorreoInstitucional { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nombre completo es obligatorio.")]
        [StringLength(150, ErrorMessage = "El nombre no puede superar los 150 caracteres.")]
        public string NombreCompleto { get; set; } = string.Empty;

        public int? IdCarrera { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Debes seleccionar un rol válido.")]
        public int IdRol { get; set; }

        [Required(ErrorMessage = "El estado es obligatorio.")]
        [RegularExpression("^(Activo|Inactivo)$", ErrorMessage = "El estado debe ser Activo o Inactivo.")]
        public string Estado { get; set; } = "Activo";
    }
}
