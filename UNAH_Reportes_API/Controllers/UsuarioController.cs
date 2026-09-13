using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Extensions;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsuariosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/usuarios/me
        [HttpGet("me")]
        public async Task<ActionResult<UsuarioDTO>> GetUsuarioActual()
        {
            var correoToken = User.GetCorreoInstitucional();

            var usuario = await _context.Usuarios
                .Include(u => u.Carrera)
                .Include(u => u.Rol)
                .Where(u => u.CorreoInstitucional == correoToken)
                .Select(u => new UsuarioDTO
                {
                    IdUsuario = u.IdUsuario,
                    CorreoInstitucional = u.CorreoInstitucional,
                    NombreCompleto = u.NombreCompleto,
                    Carrera = u.Carrera != null ? u.Carrera.NombreCarrera : null,
                    Rol = u.Rol.NombreRol,
                    TipoAutenticacion = u.TipoAutenticacion,
                    CorreoRecuperacion = u.CorreoRecuperacion,
                    ColorAvatar = u.ColorAvatar,
                    UrlAvatar = u.UrlAvatar
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
                return NotFound("No existe un usuario registrado con este correo.");

            return Ok(usuario);
        }

        // GET: api/usuarios/5/perfil
        [HttpGet("{idUsuario:int}/perfil")]
        public async Task<ActionResult<PerfilPublicoUsuarioDTO>> GetPerfilPublico(int idUsuario)
        {
            var correoToken = User.GetCorreoInstitucional();
            var puedeVerCorreo = await _context.Usuarios.AnyAsync(u => u.CorreoInstitucional == correoToken && (u.Rol.NombreRol == "Administrador" || u.Rol.NombreRol == "Gestor"));
            var perfil = await _context.Usuarios
                .AsNoTracking()
                .Where(u => u.IdUsuario == idUsuario)
                .Select(u => new PerfilPublicoUsuarioDTO
                {
                    IdUsuario = u.IdUsuario,
                    NombreCompleto = u.NombreCompleto,
                    CorreoInstitucional = puedeVerCorreo ? u.CorreoInstitucional : null,
                    Carrera = u.Carrera == null ? null : u.Carrera.NombreCarrera,
                    Rol = u.Rol.NombreRol,
                    NumeroReportes = _context.Reportes.Count(r => r.IdUsuario == u.IdUsuario && !r.Eliminado),
                    NumeroComentarios = _context.Comentarios.Count(c => c.IdUsuario == u.IdUsuario && !c.Eliminado),
                    ColorAvatar = u.ColorAvatar,
                    UrlAvatar = u.UrlAvatar
                })
                .FirstOrDefaultAsync();

            return perfil == null ? NotFound() : Ok(perfil);
        }
    }
}
