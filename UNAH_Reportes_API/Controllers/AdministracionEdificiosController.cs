using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/administracion/edificios")]
    [ApiController]
    [Authorize(Policy = "SoloAdministrador")]
    public class AdministracionEdificiosController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AdministracionEdificiosController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Edificio>>> GetEdificios() => Ok(await _context.Edificios
            .AsNoTracking().OrderBy(edificio => edificio.NombreEdificio).ToListAsync());

        [HttpPost]
        public async Task<ActionResult<Edificio>> CrearEdificio(EdificioGuardarDTO dto)
        {
            var nombre = dto.NombreEdificio.Trim();
            if (await _context.Edificios.AnyAsync(edificio => edificio.NombreEdificio == nombre))
                return Conflict("Ya existe un edificio con ese nombre.");

            var edificio = new Edificio { NombreEdificio = nombre, Descripcion = LimpiarDescripcion(dto.Descripcion) };
            _context.Edificios.Add(edificio);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetEdificios), edificio);
        }

        [HttpPut("{idEdificio:int}")]
        public async Task<ActionResult<Edificio>> ActualizarEdificio(int idEdificio, EdificioGuardarDTO dto)
        {
            var edificio = await _context.Edificios.FindAsync(idEdificio);
            if (edificio == null) return NotFound("El edificio no existe.");

            var nombre = dto.NombreEdificio.Trim();
            if (await _context.Edificios.AnyAsync(e => e.IdEdificio != idEdificio && e.NombreEdificio == nombre))
                return Conflict("Ya existe un edificio con ese nombre.");

            edificio.NombreEdificio = nombre;
            edificio.Descripcion = LimpiarDescripcion(dto.Descripcion);
            await _context.SaveChangesAsync();
            return Ok(edificio);
        }

        [HttpDelete("{idEdificio:int}")]
        public async Task<IActionResult> EliminarEdificio(int idEdificio)
        {
            var edificio = await _context.Edificios.FindAsync(idEdificio);
            if (edificio == null) return NotFound("El edificio no existe.");

            var tieneEspacios = await _context.Espacios.AnyAsync(espacio => espacio.IdEdificio == idEdificio);
            var tieneCarreras = await _context.EdificioCarreras.AnyAsync(relacion => relacion.IdEdificio == idEdificio);
            if (tieneEspacios || tieneCarreras)
                return Conflict("No se puede eliminar un edificio que está en uso.");

            _context.Edificios.Remove(edificio);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static string? LimpiarDescripcion(string? descripcion) =>
            string.IsNullOrWhiteSpace(descripcion) ? null : descripcion.Trim();
    }
}
