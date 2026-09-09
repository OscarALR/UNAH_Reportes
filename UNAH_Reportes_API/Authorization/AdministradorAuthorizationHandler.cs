using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.Extensions;

namespace UNAH_Reportes_API.Authorization
{
    public sealed class AdministradorAuthorizationHandler 
        : AuthorizationHandler<AdministradorRequirement>
    {
        private readonly AppDbContext _context;

        public AdministradorAuthorizationHandler(AppDbContext context)
        {
            _context = context;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            AdministradorRequirement requirement)
        {
            var correo = context.User.GetCorreoInstitucional();

            if (string.IsNullOrWhiteSpace(correo))
                return;

            var esAdministrador = await _context.Usuarios
                .AsNoTracking()
                .Include(usuario => usuario.Rol)
                .AnyAsync(usuario =>
                    usuario.CorreoInstitucional == correo &&
                    usuario.Estado == "Activo" &&
                    usuario.Rol.NombreRol == "Administrador");

            if (esAdministrador)
                context.Succeed(requirement);
        }
    }
}
