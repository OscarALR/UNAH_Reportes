using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/administracion/categorias")]
    [ApiController]
    [Authorize(Policy = "SoloAdministrador")]
    public class AdministracionCategoriasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdministracionCategoriasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Categoria>>> GetCategorias()
        {
            return Ok(await _context.Categorias
                .AsNoTracking()
                .OrderBy(categoria => categoria.NombreCategoria)
                .ToListAsync());
        }

        [HttpPost]
        public async Task<ActionResult<Categoria>> CrearCategoria(CategoriaGuardarDTO dto)
        {
            var nombre = dto.NombreCategoria.Trim();

            if (await _context.Categorias.AnyAsync(categoria => categoria.NombreCategoria == nombre))
                return Conflict("Ya existe una categoría con ese nombre.");

            var categoria = new Categoria { NombreCategoria = nombre };
            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategorias), new { id = categoria.IdCategoria }, categoria);
        }

        [HttpPut("{idCategoria:int}")]
        public async Task<ActionResult<Categoria>> ActualizarCategoria(int idCategoria, CategoriaGuardarDTO dto)
        {
            var categoria = await _context.Categorias.FindAsync(idCategoria);
            if (categoria == null)
                return NotFound("La categoría no existe.");

            var nombre = dto.NombreCategoria.Trim();
            var nombreEnUso = await _context.Categorias.AnyAsync(c =>
                c.IdCategoria != idCategoria && c.NombreCategoria == nombre);

            if (nombreEnUso)
                return Conflict("Ya existe una categoría con ese nombre.");

            categoria.NombreCategoria = nombre;
            await _context.SaveChangesAsync();

            return Ok(categoria);
        }

        [HttpDelete("{idCategoria:int}")]
        public async Task<IActionResult> EliminarCategoria(int idCategoria)
        {
            var categoria = await _context.Categorias.FindAsync(idCategoria);
            if (categoria == null)
                return NotFound("La categoría no existe.");

            var tieneReportes = await _context.Reportes.AnyAsync(reporte => reporte.IdCategoria == idCategoria);
            var tieneCarreras = await _context.CategoriaCarreras.AnyAsync(relacion => relacion.IdCategoria == idCategoria);

            if (tieneReportes || tieneCarreras)
                return Conflict("No se puede eliminar una categoría que está en uso.");

            _context.Categorias.Remove(categoria);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
