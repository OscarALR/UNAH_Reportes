namespace UNAH_Reportes_API.DTOs
{
    public class EspacioAdministracionDTO
    {
        public int IdEspacio { get; set; }
        public string NombreEspacio { get; set; } = string.Empty;
        public int? IdEdificio { get; set; }
        public string? Edificio { get; set; }
        public int IdTipoEspacio { get; set; }
        public string TipoEspacio { get; set; } = string.Empty;
    }
}
