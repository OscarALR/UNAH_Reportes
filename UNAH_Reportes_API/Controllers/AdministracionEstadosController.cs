using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/administracion/estados")]
    [ApiController]
    [Authorize(Policy = "SoloAdministrador")]
    public class AdministracionEstadosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdministracionEstadosController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Estado>>> GetEstados() => Ok(await _context.Estados
            .AsNoTracking()
            .OrderBy(estado => estado.NombreEstado)
            .ToListAsync());

        [HttpPost]
        public async Task<ActionResult<Estado>> CrearEstado(EstadoGuardarDTO dto)
        {
            var nombre = dto.NombreEstado.Trim();
            if (nombre.Equals("Cerrado", StringComparison.OrdinalIgnoreCase))
                return BadRequest("\"Cerrado\" ya no es un estado válido. Usa \"Resuelto\" o archiva el reporte según corresponda.");
            if (await _context.Estados.AnyAsync(estado => estado.NombreEstado == nombre))
                return Conflict("Ya existe un estado con ese nombre.");

            var estado = new Estado { NombreEstado = nombre };
            _context.Estados.Add(estado);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetEstados), new { idEstado = estado.IdEstado }, estado);
        }

        [HttpPut("{idEstado:int}")]
        public async Task<ActionResult<Estado>> ActualizarEstado(int idEstado, EstadoGuardarDTO dto)
        {
            var estado = await _context.Estados.FindAsync(idEstado);
            if (estado == null) return NotFound("El estado no existe.");

            var nombre = dto.NombreEstado.Trim();
            if (nombre.Equals("Cerrado", StringComparison.OrdinalIgnoreCase))
                return BadRequest("\"Cerrado\" ya no es un estado válido. Usa \"Resuelto\" o archiva el reporte según corresponda.");
            if (await _context.Estados.AnyAsync(e => e.IdEstado != idEstado && e.NombreEstado == nombre))
                return Conflict("Ya existe un estado con ese nombre.");

            estado.NombreEstado = nombre;
            await _context.SaveChangesAsync();
            return Ok(estado);
        }

        [HttpDelete("{idEstado:int}")]
        public async Task<IActionResult> EliminarEstado(int idEstado)
        {
            var estado = await _context.Estados.FindAsync(idEstado);
            if (estado == null) return NotFound("El estado no existe.");

            var esEstadoActual = await _context.Reportes.AnyAsync(reporte => reporte.IdEstadoActual == idEstado);
            var tieneHistorial = await _context.HistorialEstados.AnyAsync(historial => historial.IdEstado == idEstado);
            if (esEstadoActual || tieneHistorial)
                return Conflict("No se puede eliminar un estado que está en uso por reportes o su historial.");

            _context.Estados.Remove(estado);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
