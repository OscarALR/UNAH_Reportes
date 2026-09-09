namespace UNAH_Reportes_API.DTOs
{
    public class EspacioDTO
    {
        public int IdEspacio { get; set; }
        public string NombreEspacio { get; set; } = string.Empty;
        public string TipoEspacio { get; set; } = string.Empty;
        public string? Edificio { get; set; }
    }
}
