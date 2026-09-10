using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.Models
{
    public class TokenRecuperacionContrasena
    {
        [Key] public int IdTokenRecuperacion { get; set; }
        public int IdUsuario { get; set; }
        [StringLength(64)] public string TokenHash { get; set; } = string.Empty;
        public DateTime CreadoEn { get; set; }
        public DateTime ExpiraEn { get; set; }
        public DateTime? UsadoEn { get; set; }
        public Usuario Usuario { get; set; } = null!;
    }
}
