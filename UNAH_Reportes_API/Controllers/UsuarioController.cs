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
                    CorreoRecuperacion = u.CorreoRecuperacion
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
                return NotFound("No existe un usuario registrado con este correo.");

            return Ok(usuario);
        }
    }
}
