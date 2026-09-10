using Azure;
using Azure.Communication.Email;

namespace UNAH_Reportes_API.Services
{
    public class CorreoRecuperacionService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<CorreoRecuperacionService> _logger;

        public CorreoRecuperacionService(IConfiguration configuration, ILogger<CorreoRecuperacionService> logger)
        { _configuration = configuration; _logger = logger; }

        public async Task<bool> EnviarAsync(string destinatario, string nombre, string token)
        {
            var connectionString = _configuration["AzureCommunication:ConnectionString"];
            var remitente = _configuration["AzureCommunication:SenderAddress"];
            var appUrl = _configuration["App:PublicUrl"]?.TrimEnd('/');
            if (string.IsNullOrWhiteSpace(connectionString) || string.IsNullOrWhiteSpace(remitente) || string.IsNullOrWhiteSpace(appUrl))
            {
                _logger.LogError("Falta configurar AzureCommunication o App:PublicUrl para enviar correos de recuperación.");
                return false;
            }

            var enlace = $"{appUrl}/restablecer-contrasena?token={Uri.EscapeDataString(token)}";
            var nombreSeguro = System.Net.WebUtility.HtmlEncode(nombre);
            var enlaceSeguro = System.Net.WebUtility.HtmlEncode(enlace);
            var contenido = $"<p>Hola, {nombreSeguro}:</p><p>Recibimos una solicitud para restablecer tu contraseña de RiUVS.</p><p><a href=\"{enlaceSeguro}\">Restablecer contraseña</a></p><p>Este enlace vence en 30 minutos y solo puede usarse una vez. Si no solicitaste este cambio, ignora este correo.</p>";
            try
            {
                var cliente = new EmailClient(connectionString);
                await cliente.SendAsync(WaitUntil.Completed, remitente, destinatario, "Restablece tu contraseña de RiUVS", contenido, "Usa este enlace para restablecer tu contraseña: " + enlace);
                return true;
            }
            catch (RequestFailedException ex)
            {
                _logger.LogError(ex, "Azure Communication Services rechazó el correo de recuperación.");
                return false;
            }
        }
    }
}
