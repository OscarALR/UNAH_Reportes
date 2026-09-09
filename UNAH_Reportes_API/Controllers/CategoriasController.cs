using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using UNAH_Reportes_API.Data;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class CategoriasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriasController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/categorias
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCategorias()
        {
            var categorias = await _context.Categorias.ToListAsync();
            return Ok(categorias);
        }
    }
}
