using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Cryptography;
using System.Text;
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
        private static readonly HashSet<string> ColoresAvatarPermitidos = new(StringComparer.OrdinalIgnoreCase)
        {
            "#1F6F8B", "#1E8449", "#6C3483", "#7B241C", "#7D6608", "#2C3E50", "#117864", "#AF601A"
        };
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Usuario> _passwordHasher;
        private readonly LocalTokenService _tokens;
        private readonly CorreoRecuperacionService _correoRecuperacion;
        private readonly BlobStorageService _blobStorage;
        private readonly ILogger<AutenticacionController> _logger;

        public AutenticacionController(AppDbContext context, IPasswordHasher<Usuario> passwordHasher, LocalTokenService tokens, CorreoRecuperacionService correoRecuperacion, BlobStorageService blobStorage, ILogger<AutenticacionController> logger)
        { _context = context; _passwordHasher = passwordHasher; _tokens = tokens; _correoRecuperacion = correoRecuperacion; _blobStorage = blobStorage; _logger = logger; }

        [AllowAnonymous]
        [HttpGet("carreras")]
        public async Task<IActionResult> GetCarreras() => Ok(await _context.Carreras.AsNoTracking().OrderBy(c => c.NombreCarrera).ToListAsync());

        [AllowAnonymous]
        [HttpPost("registro")]
        public async Task<IActionResult> Registro(RegistroLocalDTO dto)
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
            return StatusCode(StatusCodes.Status201Created, new { mensaje = "Cuenta creada exitosamente, Inicie sesión para continuar" });
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
            if (!string.IsNullOrWhiteSpace(dto.ColorAvatar) && !ColoresAvatarPermitidos.Contains(dto.ColorAvatar))
                return BadRequest("El color de avatar seleccionado no está permitido.");
            usuario.NombreCompleto = dto.NombreCompleto.Trim();
            usuario.IdCarrera = dto.IdCarrera;
            usuario.ColorAvatar = dto.ColorAvatar;
            if (usuario.TipoAutenticacion is "Local" or "Prueba" && !string.IsNullOrWhiteSpace(dto.CorreoRecuperacion))
                usuario.CorreoRecuperacion = dto.CorreoRecuperacion.Trim().ToLowerInvariant();
            await _context.SaveChangesAsync();
            await _context.Entry(usuario).Reference(u => u.Carrera).LoadAsync();
            return Ok(MapearUsuario(usuario));
        }

        [Authorize]
        [HttpPut("perfil/avatar")]
        public async Task<ActionResult<UsuarioDTO>> ActualizarAvatar(IFormFile? archivo)
        {
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.Include(u => u.Carrera).Include(u => u.Rol).SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();
            if (archivo == null || archivo.Length == 0) return BadRequest("No se recibió ninguna imagen.");

            var tiposPermitidos = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            if (!tiposPermitidos.Contains(archivo.ContentType.ToLowerInvariant())) return BadRequest("Solo se permiten imágenes JPEG, PNG, WEBP o GIF.");
            if (archivo.Length > 5 * 1024 * 1024) return BadRequest("La imagen no puede superar 5 MB.");

            usuario.UrlAvatar = await _blobStorage.SubirImagenAsync(archivo);
            await _context.SaveChangesAsync();
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

        [AllowAnonymous]
        [EnableRateLimiting("RecuperacionContrasena")]
        [HttpPost("recuperar-contrasena")]
        public async Task<IActionResult> SolicitarRecuperacion(SolicitarRecuperacionContrasenaDTO dto)
        {
            const string respuesta = "Si existe una cuenta local asociada a ese correo, enviaremos las instrucciones de recuperación.";
            var correo = dto.Correo.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios.SingleOrDefaultAsync(u => u.CorreoInstitucional == correo && u.Estado == "Activo" && u.TipoAutenticacion == "Local");
            if (usuario == null || string.IsNullOrWhiteSpace(usuario.CorreoRecuperacion)) return Ok(new { mensaje = respuesta });

            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).TrimEnd('=').Replace('+', '-').Replace('/', '_');
            var ahora = DateTime.UtcNow;
            await _context.TokensRecuperacionContrasena
                .Where(t => t.IdUsuario == usuario.IdUsuario && t.UsadoEn == null && t.ExpiraEn > ahora)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsadoEn, ahora));

            var registro = new TokenRecuperacionContrasena
            {
                IdUsuario = usuario.IdUsuario,
                TokenHash = CalcularHashToken(token),
                CreadoEn = ahora,
                ExpiraEn = ahora.AddMinutes(30)
            };
            _context.TokensRecuperacionContrasena.Add(registro);
            await _context.SaveChangesAsync();

            if (!await _correoRecuperacion.EnviarAsync(usuario.CorreoRecuperacion, usuario.NombreCompleto, token))
            {
                _context.TokensRecuperacionContrasena.Remove(registro);
                await _context.SaveChangesAsync();
                _logger.LogError("No se pudo enviar el correo de recuperación para el usuario {IdUsuario}.", usuario.IdUsuario);
            }
            return Ok(new { mensaje = respuesta });
        }

        [AllowAnonymous]
        [HttpPost("restablecer-contrasena")]
        public async Task<IActionResult> RestablecerContrasena(RestablecerContrasenaDTO dto)
        {
            var ahora = DateTime.UtcNow;
            var tokenHash = CalcularHashToken(dto.Token);
            var registro = await _context.TokensRecuperacionContrasena.Include(t => t.Usuario)
                .SingleOrDefaultAsync(t => t.TokenHash == tokenHash && t.UsadoEn == null && t.ExpiraEn > ahora);
            if (registro == null || registro.Usuario.Estado != "Activo" || registro.Usuario.TipoAutenticacion != "Local")
                return BadRequest("El enlace de recuperación no es válido o ya venció.");

            registro.Usuario.PasswordHash = _passwordHasher.HashPassword(registro.Usuario, dto.NuevaContrasena);
            registro.UsadoEn = ahora;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static string CalcularHashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        private SesionLocalDTO CrearSesion(Usuario usuario) => new() { Token = _tokens.CrearToken(usuario), Usuario = MapearUsuario(usuario) };
        private static UsuarioDTO MapearUsuario(Usuario usuario) => new() { IdUsuario = usuario.IdUsuario, CorreoInstitucional = usuario.CorreoInstitucional, NombreCompleto = usuario.NombreCompleto, Carrera = usuario.Carrera?.NombreCarrera, Rol = usuario.Rol.NombreRol, TipoAutenticacion = usuario.TipoAutenticacion, CorreoRecuperacion = usuario.CorreoRecuperacion, ColorAvatar = usuario.ColorAvatar, UrlAvatar = usuario.UrlAvatar };
    }
}
