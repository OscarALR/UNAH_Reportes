using System.ComponentModel.DataAnnotations;

namespace UNAH_Reportes_API.Models
{
    public class Espacio
    {
        [Key]
        public int IdEspacio { get; set; }
        public int? IdEdificio { get; set; }
        public string NombreEspacio { get; set; } = string.Empty;
        public int IdTipoEspacio { get; set; }

        public Edificio? Edificio { get; set; }
        public TipoEspacio TipoEspacio { get; set; } = null!;
    }
}
