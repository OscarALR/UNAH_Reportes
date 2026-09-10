namespace UNAH_Reportes_API.DTOs
{
    public class DashboardResumenDTO
    {
        public int TotalReportes { get; set; }
        public int ReportesAbiertos { get; set; }
        public int ReportesCerrados { get; set; }
        public int ReportesAltaPrioridad { get; set; }
        public int ReportesSinGestor { get; set; }
        public double? TiempoPromedioResolucionHoras { get; set; }
        public double? CumplimientoSla72Horas { get; set; }
        public List<DashboardEtiquetaValorDTO> PorEstado { get; set; } = [];
        public List<DashboardEtiquetaValorDTO> PorPrioridad { get; set; } = [];
        public List<DashboardEtiquetaValorDTO> PorCategoria { get; set; } = [];
        public List<DashboardEtiquetaValorDTO> PorEdificio { get; set; } = [];
        public List<DashboardEtiquetaValorDTO> PorEspacio { get; set; } = [];
        public List<DashboardEtiquetaValorDTO> PorCarrera { get; set; } = [];
        public List<DashboardEtiquetaValorDTO> PorTipoEspacio { get; set; } = [];
        public List<DashboardEtiquetaValorDTO> PorGestor { get; set; } = [];
        public List<DashboardEtiquetaValorDTO> CambiosPorResponsable { get; set; } = [];
        public List<DashboardMatrizOperacionDTO> MatrizOperacion { get; set; } = [];
        public List<DashboardReporteRecienteDTO> ReportesRecientes { get; set; } = [];
        public List<DashboardTendenciaDTO> TendenciaDiaria { get; set; } = [];
    }

    public class DashboardEtiquetaValorDTO
    {
        public string Etiqueta { get; set; } = string.Empty;
        public int Valor { get; set; }
    }

    public class DashboardTendenciaDTO
    {
        public string Fecha { get; set; } = string.Empty;
        public int Valor { get; set; }
    }

    public class DashboardMatrizOperacionDTO
    {
        public string Gestor { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public int Valor { get; set; }
    }

    public class DashboardReporteRecienteDTO
    {
        public int IdReporte { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Espacio { get; set; } = string.Empty;
        public string Edificio { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string Prioridad { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
    }
}
