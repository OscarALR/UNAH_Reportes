using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/administracion/espacios")]
    [ApiController]
    [Authorize(Policy = "SoloAdministrador")]
    public class AdministracionEspaciosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdministracionEspaciosController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EspacioAdministracionDTO>>> GetEspacios()
        {
            return Ok(await ConsultaEspacios()
                .OrderBy(espacio => espacio.Edificio)
                .ThenBy(espacio => espacio.NombreEspacio)
                .ToListAsync());
        }

        [HttpPost]
        public async Task<ActionResult<EspacioAdministracionDTO>> CrearEspacio(EspacioGuardarDTO dto)
        {
            var error = await ValidarReferencias(dto);
            if (error != null) return BadRequest(error);

            var nombre = dto.NombreEspacio.Trim();
            if (await ExisteNombreEnUbicacion(nombre, dto.IdEdificio, null))
                return Conflict("Ya existe un espacio con ese nombre en esa ubicación.");

            var espacio = new Espacio
            {
                NombreEspacio = nombre,
                IdEdificio = dto.IdEdificio,
                IdTipoEspacio = dto.IdTipoEspacio
            };
            _context.Espacios.Add(espacio);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEspacios), new { idEspacio = espacio.IdEspacio }, await ObtenerEspacio(espacio.IdEspacio));
        }

        [HttpPut("{idEspacio:int}")]
        public async Task<ActionResult<EspacioAdministracionDTO>> ActualizarEspacio(int idEspacio, EspacioGuardarDTO dto)
        {
            var espacio = await _context.Espacios.FindAsync(idEspacio);
            if (espacio == null) return NotFound("El espacio no existe.");

            var error = await ValidarReferencias(dto);
            if (error != null) return BadRequest(error);

            var nombre = dto.NombreEspacio.Trim();
            if (await ExisteNombreEnUbicacion(nombre, dto.IdEdificio, idEspacio))
                return Conflict("Ya existe un espacio con ese nombre en esa ubicación.");

            espacio.NombreEspacio = nombre;
            espacio.IdEdificio = dto.IdEdificio;
            espacio.IdTipoEspacio = dto.IdTipoEspacio;
            await _context.SaveChangesAsync();

            return Ok(await ObtenerEspacio(idEspacio));
        }

        [HttpDelete("{idEspacio:int}")]
        public async Task<IActionResult> EliminarEspacio(int idEspacio)
        {
            var espacio = await _context.Espacios.FindAsync(idEspacio);
            if (espacio == null) return NotFound("El espacio no existe.");

            var tieneReportes = await _context.Reportes.AnyAsync(reporte => reporte.IdEspacio == idEspacio);
            if (tieneReportes)
                return Conflict("No se puede eliminar un espacio que está en uso por reportes.");

            _context.Espacios.Remove(espacio);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private IQueryable<EspacioAdministracionDTO> ConsultaEspacios() => _context.Espacios
            .AsNoTracking()
            .Select(espacio => new EspacioAdministracionDTO
            {
                IdEspacio = espacio.IdEspacio,
                NombreEspacio = espacio.NombreEspacio,
                IdEdificio = espacio.IdEdificio,
                Edificio = espacio.Edificio == null ? null : espacio.Edificio.NombreEdificio,
                IdTipoEspacio = espacio.IdTipoEspacio,
                TipoEspacio = espacio.TipoEspacio.NombreTipo
            });

        private async Task<EspacioAdministracionDTO> ObtenerEspacio(int idEspacio) => await ConsultaEspacios()
            .SingleAsync(espacio => espacio.IdEspacio == idEspacio);

        private async Task<bool> ExisteNombreEnUbicacion(string nombre, int? idEdificio, int? idExcluir) => await _context.Espacios.AnyAsync(espacio =>
            espacio.NombreEspacio == nombre &&
            espacio.IdEdificio == idEdificio &&
            espacio.IdEspacio != idExcluir);

        private async Task<string?> ValidarReferencias(EspacioGuardarDTO dto)
        {
            if (dto.IdEdificio.HasValue && !await _context.Edificios.AnyAsync(edificio => edificio.IdEdificio == dto.IdEdificio))
                return "El edificio seleccionado no existe.";

            if (!await _context.TiposEspacio.AnyAsync(tipo => tipo.IdTipoEspacio == dto.IdTipoEspacio))
                return "El tipo de espacio seleccionado no existe.";

            return null;
        }
    }
}
