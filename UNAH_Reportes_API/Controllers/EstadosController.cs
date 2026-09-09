using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using UNAH_Reportes_API.Data;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class EstadosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EstadosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/estados
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetEstados()
        {
            var estados = await _context.Estados.ToListAsync();
            return Ok(estados);
        }
    }
}
