using System.ComponentModel.DataAnnotations;
namespace UNAH_Reportes_API.DTOs
{
    public class ComentarioCrearDTO
    {
        [Required(ErrorMessage = "El comentario no puede estar vacío.")]
        [MaxLength(500, ErrorMessage = "El comentario no puede superar los 500 caracteres.")]
        public string Texto { get; set; } = string.Empty;
    }
}
