using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/administracion/usuarios")]
    [ApiController]
    [Authorize(Policy = "SoloAdministrador")]
    public class AdministracionUsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdministracionUsuariosController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UsuarioAdministracionDTO>>> GetUsuarios() => Ok(await ConsultaUsuarios()
            .OrderBy(usuario => usuario.NombreCompleto)
            .ToListAsync());

        [HttpGet("catalogos")]
        public async Task<IActionResult> GetCatalogos() => Ok(new
        {
            roles = await _context.Roles.AsNoTracking().OrderBy(rol => rol.NombreRol).ToListAsync(),
            carreras = await _context.Carreras.AsNoTracking().OrderBy(carrera => carrera.NombreCarrera).ToListAsync()
        });

        [HttpPost]
        public async Task<ActionResult<UsuarioAdministracionDTO>> CrearUsuario(UsuarioGuardarDTO dto)
        {
            var error = await ValidarReferencias(dto);
            if (error != null) return BadRequest(error);

            var correo = dto.CorreoInstitucional.Trim().ToLowerInvariant();
            if (await _context.Usuarios.AnyAsync(usuario => usuario.CorreoInstitucional == correo))
                return Conflict("Ya existe un usuario con ese correo institucional.");

            var usuario = new Usuario
            {
                CorreoInstitucional = correo,
                NombreCompleto = dto.NombreCompleto.Trim(),
                IdCarrera = dto.IdCarrera,
                IdRol = dto.IdRol,
                Estado = dto.Estado
            };
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuarios), new { idUsuario = usuario.IdUsuario }, await ObtenerUsuario(usuario.IdUsuario));
        }

        [HttpPut("{idUsuario:int}")]
        public async Task<ActionResult<UsuarioAdministracionDTO>> ActualizarUsuario(int idUsuario, UsuarioGuardarDTO dto)
        {
            var usuario = await _context.Usuarios.FindAsync(idUsuario);
            if (usuario == null) return NotFound("El usuario no existe.");

            var error = await ValidarReferencias(dto);
            if (error != null) return BadRequest(error);

            var correo = dto.CorreoInstitucional.Trim().ToLowerInvariant();
            if (await _context.Usuarios.AnyAsync(u => u.IdUsuario != idUsuario && u.CorreoInstitucional == correo))
                return Conflict("Ya existe un usuario con ese correo institucional.");

            if (await SeQuedariaSinAdministrador(idUsuario, dto.IdRol, dto.Estado))
                return Conflict("Debe mantenerse al menos un administrador activo.");

            usuario.CorreoInstitucional = correo;
            usuario.NombreCompleto = dto.NombreCompleto.Trim();
            usuario.IdCarrera = dto.IdCarrera;
            usuario.IdRol = dto.IdRol;
            usuario.Estado = dto.Estado;
            await _context.SaveChangesAsync();

            return Ok(await ObtenerUsuario(idUsuario));
        }

        [HttpDelete("{idUsuario:int}")]
        public async Task<IActionResult> EliminarUsuario(int idUsuario)
        {
            var usuario = await _context.Usuarios.FindAsync(idUsuario);
            if (usuario == null) return NotFound("El usuario no existe.");

            if (await SeQuedariaSinAdministrador(idUsuario, 0, "Inactivo"))
                return Conflict("No se puede eliminar al último administrador activo.");

            var tieneReportes = await _context.Reportes.AnyAsync(reporte => reporte.IdUsuario == idUsuario || reporte.IdGestorAsignado == idUsuario);
            var tieneHistorial = await _context.HistorialEstados.AnyAsync(historial => historial.IdUsuario == idUsuario);
            var tieneComentarios = await _context.Comentarios.AnyAsync(comentario => comentario.IdUsuario == idUsuario);
            var tieneNotificaciones = await _context.Notificaciones.AnyAsync(notificacion => notificacion.IdUsuario == idUsuario);
            if (tieneReportes || tieneHistorial || tieneComentarios || tieneNotificaciones)
                return Conflict("No se puede eliminar un usuario que tiene actividad registrada; puedes marcarlo como inactivo.");

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private IQueryable<UsuarioAdministracionDTO> ConsultaUsuarios() => _context.Usuarios
            .AsNoTracking()
            .Select(usuario => new UsuarioAdministracionDTO
            {
                IdUsuario = usuario.IdUsuario,
                CorreoInstitucional = usuario.CorreoInstitucional,
                NombreCompleto = usuario.NombreCompleto,
                IdCarrera = usuario.IdCarrera,
                Carrera = usuario.Carrera == null ? null : usuario.Carrera.NombreCarrera,
                IdRol = usuario.IdRol,
                Rol = usuario.Rol.NombreRol,
                Estado = usuario.Estado,
                FechaRegistro = usuario.FechaRegistro
            });

        private async Task<UsuarioAdministracionDTO> ObtenerUsuario(int idUsuario) => await ConsultaUsuarios()
            .SingleAsync(usuario => usuario.IdUsuario == idUsuario);

        private async Task<string?> ValidarReferencias(UsuarioGuardarDTO dto)
        {
            if (!await _context.Roles.AnyAsync(rol => rol.IdRol == dto.IdRol)) return "El rol seleccionado no existe.";
            if (dto.IdCarrera.HasValue && !await _context.Carreras.AnyAsync(carrera => carrera.IdCarrera == dto.IdCarrera))
                return "La carrera seleccionada no existe.";
            return null;
        }

        private async Task<bool> SeQuedariaSinAdministrador(int idUsuario, int? nuevoIdRol, string? nuevoEstado)
        {
            var administrador = await _context.Usuarios
                .AsNoTracking()
                .Include(usuario => usuario.Rol)
                .SingleOrDefaultAsync(usuario => usuario.IdUsuario == idUsuario);

            if (administrador?.Rol.NombreRol != "Administrador" || administrador.Estado != "Activo") return false;

            var conservaAdministracion = nuevoIdRol == null || nuevoIdRol == administrador.IdRol;
            var conservaEstadoActivo = nuevoEstado == null || nuevoEstado == "Activo";
            if (conservaAdministracion && conservaEstadoActivo) return false;

            return !await _context.Usuarios
                .Include(usuario => usuario.Rol)
                .AnyAsync(usuario => usuario.IdUsuario != idUsuario && usuario.Estado == "Activo" && usuario.Rol.NombreRol == "Administrador");
        }
    }
}
