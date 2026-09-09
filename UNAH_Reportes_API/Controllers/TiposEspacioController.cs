using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using UNAH_Reportes_API.Data;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class TiposEspacioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TiposEspacioController(AppDbContext context) 
        {
            _context = context;
        }

        // GET: api/tiposespacio
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetTiposEspacio() 
        {
            var tipos = await _context.TiposEspacio.ToListAsync();
            return Ok(tipos);
        }
    }
}
