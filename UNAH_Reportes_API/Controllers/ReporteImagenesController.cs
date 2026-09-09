using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.Models;
using UNAH_Reportes_API.Services;
using UNAH_Reportes_API.Extensions;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/reportes/{idReporte}/imagenes")]
    [ApiController]
    [Authorize]
    public class ReporteImagenesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly BlobStorageService _blobService;

        public ReporteImagenesController(AppDbContext context, BlobStorageService blobService)
        {
            _context = context;
            _blobService = blobService;
        }

        // GET: api/reportes/5/imagenes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<string>>> GetImagenes(int idReporte)
        {
            var urls = await _context.ReporteImagenes
                .Where(ri => ri.IdReporte == idReporte)
                .Select(ri => ri.UrlAzureBlob)
                .ToListAsync();

            return Ok(urls);
        }

        // POST: api/reportes/5/imagenes
        [HttpPost]
        public async Task<ActionResult> SubirImagen(int idReporte, IFormFile archivo)
        {
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.Include(u => u.Rol)
                .SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();

            var reporte = await _context.Reportes.FindAsync(idReporte);
            if (reporte == null)
                return NotFound($"No existe un reporte con ID {idReporte}");

            var puedeAdjuntar = reporte.IdUsuario == usuario.IdUsuario ||
                usuario.Rol.NombreRol is "Gestor" or "Administrador";
            if (!puedeAdjuntar) return Forbid();

            if (archivo == null || archivo.Length == 0)
                return BadRequest("No se recibió ningún archivo.");

            if (!archivo.ContentType.StartsWith("image/"))
                return BadRequest("Solo se permiten imágenes.");

            if (archivo.Length > 5 * 1024 * 1024)
                return BadRequest("La imagen no puede superar 5 MB.");

            string url = await _blobService.SubirImagenAsync(archivo);

            var imagen = new ReporteImagen
            {
                IdReporte = idReporte,
                UrlAzureBlob = url,
                FechaSubida = DateTime.Now
            };

            _context.ReporteImagenes.Add(imagen);
            await _context.SaveChangesAsync();

            return Ok(new { url });
        }
    }
}
