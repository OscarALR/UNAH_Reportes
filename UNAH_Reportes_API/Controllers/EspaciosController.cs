using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class EspaciosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EspaciosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/espacios
        // Todos los espacios, sin filtrar (útil para depurar o listados generales)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EspacioDTO>>> GetEspacios()
        {
            var espacios = await _context.Espacios
                .Include(e => e.TipoEspacio)
                .Include(e => e.Edificio)
                .Select(e => new EspacioDTO
                {
                    IdEspacio = e.IdEspacio,
                    NombreEspacio = e.NombreEspacio,
                    TipoEspacio = e.TipoEspacio.NombreTipo,
                    Edificio = e.Edificio != null ? e.Edificio.NombreEdificio : null
                })
                .ToListAsync();

            return Ok(espacios);
        }

        // GET: api/espacios/sin-edificio
        // Espacios que no pertenecen a ningún edificio (áreas comunes, canchas, estacionamientos, etc.)
        [HttpGet("sin-edificio")]
        public async Task<ActionResult<IEnumerable<EspacioDTO>>> GetEspaciosSinEdificio()
        {
            var espacios = await _context.Espacios
                .Include(e => e.TipoEspacio)
                .Where(e => e.IdEdificio == null)
                .Select(e => new EspacioDTO
                {
                    IdEspacio = e.IdEspacio,
                    NombreEspacio = e.NombreEspacio,
                    TipoEspacio = e.TipoEspacio.NombreTipo,
                    Edificio = null
                })
                .ToListAsync();

            return Ok(espacios);
        }
    }
}
