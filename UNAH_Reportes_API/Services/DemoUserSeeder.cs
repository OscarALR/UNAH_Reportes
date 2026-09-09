using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Services
{
    public class DemoUserSeeder
    {
        private const string CorreoPrueba = "prueba@unahreportes.local";
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Usuario> _passwordHasher;
        private readonly IConfiguration _configuration;

        public DemoUserSeeder(AppDbContext context, IPasswordHasher<Usuario> passwordHasher, IConfiguration configuration)
        { _context = context; _passwordHasher = passwordHasher; _configuration = configuration; }

        public async Task CrearSiCorrespondeAsync()
        {
            if (!_configuration.GetValue<bool>("DemoUser:Enabled") || await _context.Usuarios.AnyAsync(u => u.CorreoInstitucional == CorreoPrueba)) return;
            var rol = await _context.Roles.SingleOrDefaultAsync(r => r.NombreRol == "Estudiante");
            if (rol == null) return;
            var usuario = new Usuario
            {
                CorreoInstitucional = CorreoPrueba,
                NombreCompleto = "Usuario de prueba",
                IdCarrera = await _context.Carreras.OrderBy(c => c.IdCarrera).Select(c => (int?)c.IdCarrera).FirstOrDefaultAsync(),
                IdRol = rol.IdRol,
                TipoAutenticacion = "Prueba"
            };
            usuario.PasswordHash = _passwordHasher.HashPassword(usuario, "PruebaUNAH2026!");
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
        }
    }
}
