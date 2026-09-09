using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/administracion/tipos-espacio")]
    [ApiController]
    [Authorize(Policy = "SoloAdministrador")]
    public class AdministracionTiposEspacioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdministracionTiposEspacioController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TipoEspacio>>> GetTiposEspacio() => Ok(await _context.TiposEspacio
            .AsNoTracking()
            .OrderBy(tipo => tipo.NombreTipo)
            .ToListAsync());

        [HttpPost]
        public async Task<ActionResult<TipoEspacio>> CrearTipoEspacio(TipoEspacioGuardarDTO dto)
        {
            var nombre = dto.NombreTipo.Trim();
            if (await _context.TiposEspacio.AnyAsync(tipo => tipo.NombreTipo == nombre))
                return Conflict("Ya existe un tipo de espacio con ese nombre.");

            var tipo = new TipoEspacio { NombreTipo = nombre };
            _context.TiposEspacio.Add(tipo);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTiposEspacio), new { idTipoEspacio = tipo.IdTipoEspacio }, tipo);
        }

        [HttpPut("{idTipoEspacio:int}")]
        public async Task<ActionResult<TipoEspacio>> ActualizarTipoEspacio(int idTipoEspacio, TipoEspacioGuardarDTO dto)
        {
            var tipo = await _context.TiposEspacio.FindAsync(idTipoEspacio);
            if (tipo == null) return NotFound("El tipo de espacio no existe.");

            var nombre = dto.NombreTipo.Trim();
            if (await _context.TiposEspacio.AnyAsync(t => t.IdTipoEspacio != idTipoEspacio && t.NombreTipo == nombre))
                return Conflict("Ya existe un tipo de espacio con ese nombre.");

            tipo.NombreTipo = nombre;
            await _context.SaveChangesAsync();
            return Ok(tipo);
        }

        [HttpDelete("{idTipoEspacio:int}")]
        public async Task<IActionResult> EliminarTipoEspacio(int idTipoEspacio)
        {
            var tipo = await _context.TiposEspacio.FindAsync(idTipoEspacio);
            if (tipo == null) return NotFound("El tipo de espacio no existe.");

            if (await _context.Espacios.AnyAsync(espacio => espacio.IdTipoEspacio == idTipoEspacio))
                return Conflict("No se puede eliminar un tipo de espacio que está en uso.");

            _context.TiposEspacio.Remove(tipo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
