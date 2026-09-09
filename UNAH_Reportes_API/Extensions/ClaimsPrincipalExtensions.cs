using System.Security.Claims;
namespace UNAH_Reportes_API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static string? GetCorreoInstitucional(this ClaimsPrincipal user) 
        {
            //Microsoft envía generalmente el correo en el claim "preferred_username"
            return user.FindFirst("preferred_username")?.Value
                ?? user.FindFirst(ClaimTypes.Email)?.Value;
        }
    }
}
