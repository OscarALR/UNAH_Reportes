using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Extensions;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/usuarios/{idUsuario}/notificaciones")]
    [ApiController]
    [Authorize]
    public class NotificacionesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificacionesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/usuarios/1/notificaciones
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificacionDTO>>> GetNotificaciones(int idUsuario)
        {
            var correoToken = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.FindAsync(idUsuario);

            if (usuario == null)
                return NotFound();

            if (usuario.CorreoInstitucional != correoToken)
                return Forbid();

            var notificaciones = await _context.Notificaciones
                .Where(n => n.IdUsuario == idUsuario)
                .OrderByDescending(n => n.FechaCreacion)
                .Select(n => new NotificacionDTO
                {
                    IdNotificacion = n.IdNotificacion,
                    IdReporte = n.IdReporte,
                    Tipo = n.Tipo,
                    Mensaje = n.Mensaje,
                    Leida = n.Leida,
                    FechaCreacion = n.FechaCreacion
                })
                .ToListAsync();

            return Ok(notificaciones);
        }

        // PUT: api/usuarios/1/notificaciones/3/leida
        [HttpPut("{idNotificacion}/leida")]
        public async Task<ActionResult> MarcarLeida(int idUsuario, int idNotificacion)
        {
            var correoToken = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.FindAsync(idUsuario);

            if (usuario == null)
                return NotFound();

            if (usuario.CorreoInstitucional != correoToken)
                return Forbid();

            var notificacion = await _context.Notificaciones
                .FirstOrDefaultAsync(n => n.IdNotificacion == idNotificacion && n.IdUsuario == idUsuario);

            if (notificacion == null)
                return NotFound();

            notificacion.Leida = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}