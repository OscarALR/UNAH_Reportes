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
    public class EdificiosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EdificiosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/edificios
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetEdificios()
        {
            var edificios = await _context.Edificios.ToListAsync();
            return Ok(edificios);
        }


        // GET: api/edificios/5/espacios
        // Espacios que pertenecen a un edificio específico
        [HttpGet("{id}/espacios")]
        public async Task<ActionResult<IEnumerable<EspacioDTO>>> GetEspaciosDeEdificio(int id)
        {
            var espacios = await _context.Espacios
                .Include(e => e.TipoEspacio)
                .Include(e => e.Edificio)
                .Where(e => e.IdEdificio == id)
                .Select(e => new EspacioDTO
                {
                    IdEspacio = e.IdEspacio,
                    NombreEspacio = e.NombreEspacio,
                    TipoEspacio = e.TipoEspacio.NombreTipo,
                    Edificio = e.Edificio!.NombreEdificio
                })
                .ToListAsync();

            return Ok(espacios);
        }
    }
}
