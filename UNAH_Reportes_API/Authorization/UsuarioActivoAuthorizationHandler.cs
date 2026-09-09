using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.Extensions;

namespace UNAH_Reportes_API.Authorization
{
    public sealed class UsuarioActivoAuthorizationHandler : AuthorizationHandler<UsuarioActivoRequirement>
    {
        private readonly AppDbContext _context;

        public UsuarioActivoAuthorizationHandler(AppDbContext context) => _context = context;

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, UsuarioActivoRequirement requirement)
        {
            var correo = context.User.GetCorreoInstitucional();
            if (string.IsNullOrWhiteSpace(correo)) return;

            var usuarioActivo = await _context.Usuarios
                .AsNoTracking()
                .AnyAsync(usuario => usuario.CorreoInstitucional == correo && usuario.Estado == "Activo");

            if (usuarioActivo) context.Succeed(requirement);
        }
    }
}
