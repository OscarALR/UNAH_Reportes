using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/administracion")]
    [ApiController]
    [Authorize(Policy = "SoloAdministrador")]
    public class AdministracionController : ControllerBase
    {
        [HttpGet("verificar")]
        public IActionResult VerificarAcceso()
        {
            return Ok(new
            {
                mensaje = "Acceso administrativo autorizado."
            });
        }
    }
}
    