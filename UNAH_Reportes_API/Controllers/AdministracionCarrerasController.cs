using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/administracion/carreras")]
    [ApiController]
    [Authorize(Policy = "SoloAdministrador")]
    public class AdministracionCarrerasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdministracionCarrerasController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Carrera>>> GetCarreras() => Ok(await _context.Carreras
            .AsNoTracking().OrderBy(carrera => carrera.NombreCarrera).ToListAsync());

        [HttpPost]
        public async Task<ActionResult<Carrera>> CrearCarrera(CarreraGuardarDTO dto)
        {
            var nombre = dto.NombreCarrera.Trim();
            if (await _context.Carreras.AnyAsync(carrera => carrera.NombreCarrera == nombre))
                return Conflict("Ya existe una carrera con ese nombre.");

            var carrera = new Carrera { NombreCarrera = nombre };
            _context.Carreras.Add(carrera);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCarreras), carrera);
        }

        [HttpPut("{idCarrera:int}")]
        public async Task<ActionResult<Carrera>> ActualizarCarrera(int idCarrera, CarreraGuardarDTO dto)
        {
            var carrera = await _context.Carreras.FindAsync(idCarrera);
            if (carrera == null) return NotFound("La carrera no existe.");

            var nombre = dto.NombreCarrera.Trim();
            if (await _context.Carreras.AnyAsync(c => c.IdCarrera != idCarrera && c.NombreCarrera == nombre))
                return Conflict("Ya existe una carrera con ese nombre.");

            carrera.NombreCarrera = nombre;
            await _context.SaveChangesAsync();
            return Ok(carrera);
        }

        [HttpDelete("{idCarrera:int}")]
        public async Task<IActionResult> EliminarCarrera(int idCarrera)
        {
            var carrera = await _context.Carreras.FindAsync(idCarrera);
            if (carrera == null) return NotFound("La carrera no existe.");

            var tieneUsuarios = await _context.Usuarios.AnyAsync(usuario => usuario.IdCarrera == idCarrera);
            var tieneCategorias = await _context.CategoriaCarreras.AnyAsync(relacion => relacion.IdCarrera == idCarrera);
            var tieneEdificios = await _context.EdificioCarreras.AnyAsync(relacion => relacion.IdCarrera == idCarrera);
            if (tieneUsuarios || tieneCategorias || tieneEdificios)
                return Conflict("No se puede eliminar una carrera que está en uso.");

            _context.Carreras.Remove(carrera);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
