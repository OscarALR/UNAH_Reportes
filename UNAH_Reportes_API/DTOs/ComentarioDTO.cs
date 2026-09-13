namespace UNAH_Reportes_API.DTOs
{
    public class ComentarioDTO
    {
        public int IdComentario { get; set; }
        public int IdUsuario { get; set; }
        public string Texto { get; set; } = string.Empty;
        public string Usuario {  get; set; } = string.Empty;
        public DateTime FechaComentario { get; set; }
        public int? IdComentarioPadre { get; set; }
        public int NumeroLikes { get; set; }
        public bool LeGustaUsuarioActual { get; set; }
        public bool Eliminado { get; set; }
        public string? ColorAvatar { get; set; }
        public string? UrlAvatar { get; set; }
    }
}
