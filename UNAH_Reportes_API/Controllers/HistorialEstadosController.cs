using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/reportes/{idReporte}/historial")]
    [ApiController]
    [Authorize]
    public class HistorialEstadosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HistorialEstadosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/reportes/5/historial
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HistorialEstadoDTO>>> GetHistorial(int idReporte)
        {
            var reporteExiste = await _context.Reportes.AnyAsync(r => r.IdReporte == idReporte);
            if (!reporteExiste)
                return NotFound($"No existe un reporte con ID {idReporte}");

            var historial = await _context.HistorialEstados
                .Include(h => h.Estado)
                .Include(h => h.Usuario)
                .Where(h => h.IdReporte == idReporte)
                .OrderBy(h => h.FechaCambio)
                .ThenBy(h => h.IdHistorial)
                .Select(h => new HistorialEstadoDTO
                {
                    IdHistorial = h.IdHistorial,
                    Estado = h.Estado.NombreEstado,
                    Usuario = h.Usuario.NombreCompleto,
                    Comentario = h.Comentario,
                    FechaCambio = h.FechaCambio
                })
                .ToListAsync();

            return Ok(historial);
        }
    }
}
