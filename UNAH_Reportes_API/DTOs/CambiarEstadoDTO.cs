using System.ComponentModel.DataAnnotations;
namespace UNAH_Reportes_API.DTOs
{
    public class CambiarEstadoDTO
    {
        public int IdEstado {  get; set; }

        [MaxLength(500, ErrorMessage = "El comentario no puede superar los 500 caracteres.")]
        public string? Comentario { get; set; }
    }
}
