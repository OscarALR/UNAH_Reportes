using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Extensions;
using UNAH_Reportes_API.Models;
using UNAH_Reportes_API.Services;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/autenticacion")]
    [ApiController]
    public class AutenticacionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Usuario> _passwordHasher;
        private readonly LocalTokenService _tokens;

        public AutenticacionController(AppDbContext context, IPasswordHasher<Usuario> passwordHasher, LocalTokenService tokens)
        { _context = context; _passwordHasher = passwordHasher; _tokens = tokens; }

        [AllowAnonymous]
        [HttpGet("carreras")]
        public async Task<IActionResult> GetCarreras() => Ok(await _context.Carreras.AsNoTracking().OrderBy(c => c.NombreCarrera).ToListAsync());

        [AllowAnonymous]
        [HttpPost("registro")]
        public async Task<ActionResult<SesionLocalDTO>> Registro(RegistroLocalDTO dto)
        {
            var correo = dto.Correo.Trim().ToLowerInvariant();
            if (await _context.Usuarios.AnyAsync(u => u.CorreoInstitucional == correo)) return Conflict("Ya existe una cuenta con ese correo.");
            if (!await _context.Carreras.AnyAsync(c => c.IdCarrera == dto.IdCarrera)) return BadRequest("La carrera seleccionada no existe.");
            var rolEstudiante = await _context.Roles.SingleOrDefaultAsync(r => r.NombreRol == "Estudiante");
            if (rolEstudiante == null) return Problem("No existe el rol Estudiante en la base de datos.");
            var usuario = new Usuario { CorreoInstitucional = correo, NombreCompleto = dto.NombreCompleto.Trim(), IdCarrera = dto.IdCarrera, IdRol = rolEstudiante.IdRol, TipoAutenticacion = "Local", CorreoRecuperacion = dto.CorreoRecuperacion.Trim().ToLowerInvariant() };
            usuario.PasswordHash = _passwordHasher.HashPassword(usuario, dto.Contrasena);
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            await _context.Entry(usuario).Reference(u => u.Carrera).LoadAsync();
            await _context.Entry(usuario).Reference(u => u.Rol).LoadAsync();
            return Ok(CrearSesion(usuario));
        }

        [AllowAnonymous]
        [HttpPost("ingresar")]
        public async Task<ActionResult<SesionLocalDTO>> Ingresar(InicioSesionLocalDTO dto)
        {
            var correo = dto.Correo.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios.Include(u => u.Carrera).Include(u => u.Rol).SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null || usuario.Estado != "Activo" || string.IsNullOrEmpty(usuario.PasswordHash) || _passwordHasher.VerifyHashedPassword(usuario, usuario.PasswordHash, dto.Contrasena) == PasswordVerificationResult.Failed)
                return Unauthorized("Correo o contraseña incorrectos.");
            return Ok(CrearSesion(usuario));
        }

        [Authorize]
        [HttpPut("perfil")]
        public async Task<ActionResult<UsuarioDTO>> ActualizarPerfil(PerfilActualizarDTO dto)
        {
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.Include(u => u.Carrera).Include(u => u.Rol).SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();
            if (!await _context.Carreras.AnyAsync(c => c.IdCarrera == dto.IdCarrera)) return BadRequest("La carrera seleccionada no existe.");
            usuario.NombreCompleto = dto.NombreCompleto.Trim();
            usuario.IdCarrera = dto.IdCarrera;
            if (usuario.TipoAutenticacion is "Local" or "Prueba" && !string.IsNullOrWhiteSpace(dto.CorreoRecuperacion))
                usuario.CorreoRecuperacion = dto.CorreoRecuperacion.Trim().ToLowerInvariant();
            await _context.SaveChangesAsync();
            await _context.Entry(usuario).Reference(u => u.Carrera).LoadAsync();
            return Ok(MapearUsuario(usuario));
        }

        [Authorize]
        [HttpPut("contrasena")]
        public async Task<IActionResult> CambiarContrasena(CambiarContrasenaDTO dto)
        {
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();
            if (usuario.TipoAutenticacion != "Local" || string.IsNullOrEmpty(usuario.PasswordHash))
                return BadRequest("Esta cuenta se administra mediante Microsoft.");
            if (_passwordHasher.VerifyHashedPassword(usuario, usuario.PasswordHash, dto.ContrasenaActual) == PasswordVerificationResult.Failed)
                return BadRequest("La contraseña actual no es correcta.");
            usuario.PasswordHash = _passwordHasher.HashPassword(usuario, dto.NuevaContrasena);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private SesionLocalDTO CrearSesion(Usuario usuario) => new() { Token = _tokens.CrearToken(usuario), Usuario = MapearUsuario(usuario) };
        private static UsuarioDTO MapearUsuario(Usuario usuario) => new() { IdUsuario = usuario.IdUsuario, CorreoInstitucional = usuario.CorreoInstitucional, NombreCompleto = usuario.NombreCompleto, Carrera = usuario.Carrera?.NombreCarrera, Rol = usuario.Rol.NombreRol, TipoAutenticacion = usuario.TipoAutenticacion, CorreoRecuperacion = usuario.CorreoRecuperacion };
    }
}
