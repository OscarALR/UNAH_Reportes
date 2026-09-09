using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Services
{
    public class LocalTokenService
    {
        private readonly IConfiguration _configuration;
        public LocalTokenService(IConfiguration configuration) => _configuration = configuration;

        public string CrearToken(Usuario usuario)
        {
            var jwt = _configuration.GetSection("LocalJwt");
            var key = jwt["SigningKey"] ?? throw new InvalidOperationException("Falta configurar LocalJwt:SigningKey.");
            var credenciales = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.Email, usuario.CorreoInstitucional),
                new Claim("preferred_username", usuario.CorreoInstitucional),
                new Claim(ClaimTypes.Name, usuario.NombreCompleto),
                new Claim("auth_provider", "local")
            };
            var token = new JwtSecurityToken(jwt["Issuer"], jwt["Audience"], claims, expires: DateTime.UtcNow.AddHours(8), signingCredentials: credenciales);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
