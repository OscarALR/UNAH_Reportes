namespace UNAH_Reportes_API.Models
{
    public class EdificioCarrera
    {
        public int IdEdificio {  get; set; }
        public int IdCarrera { get; set; }

        public Edificio Edificio { get; set; } = null!;
        public Carrera Carrera { get; set; } = null!;
    }
}
