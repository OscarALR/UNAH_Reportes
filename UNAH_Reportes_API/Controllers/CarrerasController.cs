using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using UNAH_Reportes_API.Data;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class CarrerasController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CarrerasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCarreras()
        {
            var carreras = await _context.Carreras.ToListAsync();
            return Ok(carreras);
        }
    }
}
