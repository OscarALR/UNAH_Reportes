using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Extensions;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private static readonly string[] EstadosFinales = ["Resuelto", "Cerrado"];
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context) => _context = context;

        [HttpGet("resumen")]
        public async Task<ActionResult<DashboardResumenDTO>> GetResumen(
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta)
        {
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.AsNoTracking()
                .SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);

            if (usuario == null) return Unauthorized();

            var desde = fechaDesde?.Date;
            var hastaExclusiva = fechaHasta?.Date.AddDays(1);
            if (desde.HasValue && hastaExclusiva.HasValue && desde >= hastaExclusiva)
                return BadRequest("La fecha inicial debe ser anterior o igual a la fecha final.");

            // El total representa incidencias creadas en el periodo, incluso si luego se archivaron.
            // Solo "abiertos" disminuye al cerrar o archivar una incidencia.
            var consulta = _context.Reportes.AsNoTracking().AsQueryable();
            if (desde.HasValue) consulta = consulta.Where(r => r.FechaCreacion >= desde.Value);
            if (hastaExclusiva.HasValue) consulta = consulta.Where(r => r.FechaCreacion < hastaExclusiva.Value);

            var reportes = await consulta
                .Select(r => new
                {
                    r.IdReporte,
                    r.FechaCreacion,
                    r.Eliminado,
                    r.Prioridad,
                    Estado = r.EstadoActual.NombreEstado,
                    Categoria = r.Categoria.NombreCategoria,
                    Edificio = r.Espacio.Edificio == null ? "Área común" : r.Espacio.Edificio.NombreEdificio,
                    Espacio = r.Espacio.NombreEspacio,
                    TipoEspacio = r.Espacio.TipoEspacio.NombreTipo,
                    Carrera = r.Usuario.Carrera == null ? "Sin carrera" : r.Usuario.Carrera.NombreCarrera,
                    Gestor = r.GestorAsignado == null ? "Sin asignar" : r.GestorAsignado.NombreCompleto,
                    r.Titulo
                })
                .ToListAsync();

            var idsCerrados = reportes
                .Where(r => EstadosFinales.Contains(r.Estado))
                .Select(r => r.IdReporte)
                .ToList();

            var resoluciones = await _context.HistorialEstados
                .AsNoTracking()
                .Where(h => idsCerrados.Contains(h.IdReporte) && EstadosFinales.Contains(h.Estado.NombreEstado))
                .GroupBy(h => h.IdReporte)
                .Select(g => new { IdReporte = g.Key, FechaResolucion = g.Min(h => h.FechaCambio) })
                .ToDictionaryAsync(x => x.IdReporte, x => x.FechaResolucion);

            var duraciones = reportes
                .Where(r => resoluciones.ContainsKey(r.IdReporte))
                .Select(r => (resoluciones[r.IdReporte] - r.FechaCreacion).TotalHours)
                .Where(horas => horas >= 0)
                .ToList();

            var historialConsulta = _context.HistorialEstados.AsNoTracking().AsQueryable();
            if (desde.HasValue) historialConsulta = historialConsulta.Where(h => h.FechaCambio >= desde.Value);
            if (hastaExclusiva.HasValue) historialConsulta = historialConsulta.Where(h => h.FechaCambio < hastaExclusiva.Value);

            var cambiosPorResponsable = await historialConsulta
                .GroupBy(h => h.Usuario.NombreCompleto)
                .OrderByDescending(g => g.Count())
                .ThenBy(g => g.Key)
                .Select(g => new DashboardEtiquetaValorDTO { Etiqueta = g.Key, Valor = g.Count() })
                .ToListAsync();

            var resumen = new DashboardResumenDTO
            {
                TotalReportes = reportes.Count,
                ReportesCerrados = idsCerrados.Count,
                ReportesAbiertos = reportes.Count(r => !r.Eliminado && !EstadosFinales.Contains(r.Estado)),
                ReportesAltaPrioridad = reportes.Count(r => r.Prioridad.Equals("Alta", StringComparison.OrdinalIgnoreCase)),
                ReportesSinGestor = reportes.Count(r => r.Gestor == "Sin asignar"),
                TiempoPromedioResolucionHoras = duraciones.Count == 0 ? null : Math.Round(duraciones.Average(), 1),
                CumplimientoSla72Horas = duraciones.Count == 0 ? null : Math.Round(duraciones.Count(horas => horas <= 72) * 100d / duraciones.Count, 1),
                PorEstado = Agrupar(reportes, r => r.Estado),
                PorPrioridad = Agrupar(reportes, r => r.Prioridad),
                PorCategoria = Agrupar(reportes, r => r.Categoria),
                PorEdificio = Agrupar(reportes, r => r.Edificio),
                PorEspacio = Agrupar(reportes, r => r.Espacio),
                PorCarrera = Agrupar(reportes, r => r.Carrera),
                PorTipoEspacio = Agrupar(reportes, r => r.TipoEspacio),
                PorGestor = Agrupar(reportes.Where(r => !EstadosFinales.Contains(r.Estado)), r => r.Gestor),
                CambiosPorResponsable = cambiosPorResponsable,
                MatrizOperacion = reportes
                    .GroupBy(r => new { r.Gestor, r.Categoria, r.Estado })
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key.Gestor)
                    .Take(20)
                    .Select(g => new DashboardMatrizOperacionDTO
                    {
                        Gestor = g.Key.Gestor,
                        Categoria = g.Key.Categoria,
                        Estado = g.Key.Estado,
                        Valor = g.Count()
                    })
                    .ToList(),
                ReportesRecientes = reportes
                    .OrderByDescending(r => r.FechaCreacion)
                    .Take(12)
                    .Select(r => new DashboardReporteRecienteDTO
                    {
                        IdReporte = r.IdReporte,
                        Titulo = r.Titulo,
                        Espacio = r.Espacio,
                        Edificio = r.Edificio,
                        Categoria = r.Categoria,
                        Prioridad = r.Prioridad,
                        Estado = r.Estado,
                        FechaCreacion = r.FechaCreacion
                    })
                    .ToList(),
                TendenciaDiaria = CrearTendenciaDiaria(reportes.Select(r => r.FechaCreacion), desde, fechaHasta?.Date)
            };

            return Ok(resumen);
        }

        private static List<DashboardEtiquetaValorDTO> Agrupar<T>(IEnumerable<T> elementos, Func<T, string> selector) => elementos
            .GroupBy(selector)
            .OrderByDescending(grupo => grupo.Count())
            .ThenBy(grupo => grupo.Key)
            .Select(grupo => new DashboardEtiquetaValorDTO { Etiqueta = grupo.Key, Valor = grupo.Count() })
            .ToList();

        private static List<DashboardTendenciaDTO> CrearTendenciaDiaria(IEnumerable<DateTime> fechas, DateTime? desde, DateTime? hasta)
        {
            var porDia = fechas
                .GroupBy(fecha => fecha.Date)
                .ToDictionary(grupo => grupo.Key, grupo => grupo.Count());
            if (porDia.Count == 0) return [];

            var inicio = desde ?? porDia.Keys.Min();
            var fin = hasta ?? porDia.Keys.Max();
            return Enumerable.Range(0, (fin - inicio).Days + 1)
                .Select(indice => inicio.AddDays(indice))
                .Select(fecha => new DashboardTendenciaDTO
                {
                    Fecha = fecha.ToString("yyyy-MM-dd"),
                    Valor = porDia.GetValueOrDefault(fecha)
                })
                .ToList();
        }
    }
}
