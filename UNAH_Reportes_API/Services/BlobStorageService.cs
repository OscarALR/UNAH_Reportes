using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace UNAH_Reportes_API.Services
{
    public class BlobStorageService
    {
        private readonly string _connectionString;
        private readonly string _containerName;

        public BlobStorageService(IConfiguration configuration)
        {
            _connectionString = configuration["BlobStorage:ConnectionString"]!;
            _containerName = configuration["BlobStorage:ContainerName"]!;
        }

        public async Task<string> SubirImagenAsync(IFormFile archivo)
        {
            var blobServiceClient = new BlobServiceClient(_connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);


            var extension = Path.GetExtension(archivo.FileName);
            var nombreArchivo = $"{Guid.NewGuid()}{extension}";

            var blobClient = containerClient.GetBlobClient(nombreArchivo);

            var opciones = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = archivo.ContentType
                }
            };

            using (var stream = archivo.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, opciones);
            }

            return blobClient.Uri.ToString();
        }
    }
}
