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
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();
            var comentarios = await _context.Comentarios
                .Include(c => c.Usuario)
                .Where(c => c.IdReporte == idReporte)
                .OrderByDescending(c => c.FechaComentario)
                .Select(c => new ComentarioDTO
                {
                    IdComentario = c.IdComentario,
                    IdUsuario = c.IdUsuario,
                    Texto = c.Texto,
                    Usuario = c.Usuario.NombreCompleto,
                    FechaComentario = c.FechaComentario,
                    IdComentarioPadre = c.IdComentarioPadre,
                    NumeroLikes = c.Likes.Count,
                    LeGustaUsuarioActual = c.Likes.Any(l => l.IdUsuario == usuario.IdUsuario),
                    Eliminado = c.Eliminado,
                    ColorAvatar = c.Usuario.ColorAvatar,
                    UrlAvatar = c.Usuario.UrlAvatar
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
            if (dto.IdComentarioPadre.HasValue && !await _context.Comentarios.AnyAsync(c => c.IdComentario == dto.IdComentarioPadre && c.IdReporte == idReporte))
                return BadRequest("El comentario al que respondes no existe en este reporte.");

            var comentario = new Comentario
            {
                IdReporte = idReporte,
                IdUsuario = usuarioActual.IdUsuario,
                Texto = dto.Texto,
                FechaComentario = DateTime.UtcNow,
                IdComentarioPadre = dto.IdComentarioPadre
            };

            _context.Comentarios.Add(comentario);
            await _context.SaveChangesAsync();

            var comentarioCreado = await _context.Comentarios
                .Include(c => c.Usuario)
                .Where(c => c.IdComentario == comentario.IdComentario)
                .Select(c => new ComentarioDTO
                {
                    IdComentario = c.IdComentario,
                    IdUsuario = c.IdUsuario,
                    Texto = c.Texto,
                    Usuario = c.Usuario.NombreCompleto,
                    FechaComentario = c.FechaComentario,
                    IdComentarioPadre = c.IdComentarioPadre,
                    NumeroLikes = 0,
                    LeGustaUsuarioActual = false,
                    Eliminado = false,
                    ColorAvatar = c.Usuario.ColorAvatar,
                    UrlAvatar = c.Usuario.UrlAvatar
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetComentarios), new { idReporte }, comentarioCreado);
        }

        [HttpPost("{idComentario:int}/likes")]
        public async Task<IActionResult> AlternarLike(int idReporte, int idComentario)
        {
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();
            var comentario = await _context.Comentarios.SingleOrDefaultAsync(c => c.IdComentario == idComentario && c.IdReporte == idReporte);
            if (comentario == null) return NotFound();
            if (comentario.Eliminado) return Conflict("No se puede reaccionar a un comentario eliminado.");
            var like = await _context.ComentarioLikes.FindAsync(idComentario, usuario.IdUsuario);
            var activo = like == null;
            if (activo) _context.ComentarioLikes.Add(new ComentarioLike { IdComentario = idComentario, IdUsuario = usuario.IdUsuario });
            else _context.ComentarioLikes.Remove(like!);
            await _context.SaveChangesAsync();
            return Ok(new { leGusta = activo, numeroLikes = await _context.ComentarioLikes.CountAsync(l => l.IdComentario == idComentario) });
        }

        [HttpDelete("{idComentario:int}")]
        public async Task<IActionResult> EliminarComentario(int idReporte, int idComentario)
        {
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.Include(u => u.Rol).SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();
            var comentario = await _context.Comentarios.SingleOrDefaultAsync(c => c.IdComentario == idComentario && c.IdReporte == idReporte);
            if (comentario == null) return NotFound();
            if (comentario.Eliminado) return Conflict("El comentario ya fue eliminado.");

            var puedeEliminar = comentario.IdUsuario == usuario.IdUsuario || usuario.Rol.NombreRol is "Gestor" or "Administrador";
            if (!puedeEliminar) return Forbid();

            comentario.Eliminado = true;
            comentario.FechaEliminacion = DateTime.UtcNow;
            comentario.IdUsuarioEliminacion = usuario.IdUsuario;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
