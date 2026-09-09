using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Extensions;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/reportes/{idReporte}/comentarios")]
    [ApiController]
    [Authorize]
    public class ComentariosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ComentariosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/reportes/5/comentarios
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ComentarioDTO>>> GetComentarios(int idReporte)
        {
            var comentarios = await _context.Comentarios
                .Include(c => c.Usuario)
                .Where(c => c.IdReporte == idReporte)
                .OrderBy(c => c.FechaComentario)
                .Select(c => new ComentarioDTO
                {
                    IdComentario = c.IdComentario,
                    Texto = c.Texto,
                    Usuario = c.Usuario.NombreCompleto,
                    FechaComentario = c.FechaComentario
                })
                .ToListAsync();

            return Ok(comentarios);
        }

        // POST: api/reportes/5/comentarios
        [HttpPost]
        public async Task<ActionResult<ComentarioDTO>> CrearComentario(int idReporte, ComentarioCrearDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var correoToken = User.GetCorreoInstitucional();
            var usuarioActual = await _context.Usuarios.FirstOrDefaultAsync(u => u.CorreoInstitucional == correoToken);

            if (usuarioActual == null)
                return Unauthorized("No se encontró un usuario registrado con este correo.");

            var reporteExiste = await _context.Reportes.AnyAsync(r => r.IdReporte == idReporte);
            if (!reporteExiste)
                return NotFound($"No existe un reporte con ID {idReporte}");

            var comentario = new Comentario
            {
                IdReporte = idReporte,
                IdUsuario = usuarioActual.IdUsuario,
                Texto = dto.Texto,
                FechaComentario = DateTime.Now
            };

            _context.Comentarios.Add(comentario);
            await _context.SaveChangesAsync();

            var comentarioCreado = await _context.Comentarios
                .Include(c => c.Usuario)
                .Where(c => c.IdComentario == comentario.IdComentario)
                .Select(c => new ComentarioDTO
                {
                    IdComentario = c.IdComentario,
                    Texto = c.Texto,
                    Usuario = c.Usuario.NombreCompleto,
                    FechaComentario = c.FechaComentario
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetComentarios), new { idReporte }, comentarioCreado);
        }
    }
}