using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        
        public DbSet<Rol> Roles { get; set; }
        public DbSet<Carrera> Carreras { get; set; }
        public DbSet<Edificio> Edificios { get; set; }
        public DbSet<TipoEspacio> TiposEspacio {  get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Estado> Estados { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<TokenRecuperacionContrasena> TokensRecuperacionContrasena { get; set; }
        public DbSet<Espacio> Espacios { get; set; }
        public DbSet<CategoriaCarrera> CategoriaCarreras { get; set; }
        public DbSet<EdificioCarrera> EdificioCarreras { get; set; }
        public DbSet<Reporte> Reportes { get; set; }
        public DbSet<HistorialEstado> HistorialEstados { get; set; }
        public DbSet<ReporteImagen> ReporteImagenes { get; set; }
        public DbSet<Comentario> Comentarios { get; set; }
        public DbSet<Notificacion> Notificaciones { get; set; }
        public DbSet<ReporteLike> ReporteLikes { get; set; }
        public DbSet<ComentarioLike> ComentarioLikes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Llaves compuestas
            modelBuilder.Entity<CategoriaCarrera>()
                .HasKey(cc => new { cc.IdCategoria, cc.IdCarrera });
            modelBuilder.Entity<CategoriaCarrera>().ToTable("CategoriaCarrera");

            modelBuilder.Entity<EdificioCarrera>()
                .HasKey(ec => new { ec.IdEdificio, ec.IdCarrera });
            modelBuilder.Entity<EdificioCarrera>().ToTable("EdificioCarrera");

            // Usuario
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Carrera)
                .WithMany()
                .HasForeignKey(u => u.IdCarrera)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Rol)
                .WithMany()
                .HasForeignKey(u => u.IdRol)
                .OnDelete(DeleteBehavior.Restrict);

            // Espacio
            modelBuilder.Entity<Espacio>()
                .HasOne(e => e.Edificio)
                .WithMany()
                .HasForeignKey(e => e.IdEdificio)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Espacio>()
                .HasOne(e => e.TipoEspacio)
                .WithMany()
                .HasForeignKey(e => e.IdTipoEspacio)
                .OnDelete(DeleteBehavior.Restrict);

            // CategoriaCarrera
            modelBuilder.Entity<CategoriaCarrera>()
                .HasOne(cc => cc.Categoria)
                .WithMany()
                .HasForeignKey(cc => cc.IdCategoria)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CategoriaCarrera>()
                .HasOne(cc => cc.Carrera)
                .WithMany()
                .HasForeignKey(cc => cc.IdCarrera)
                .OnDelete(DeleteBehavior.Restrict);

            // EdificioCarrera
            modelBuilder.Entity<EdificioCarrera>()
                .HasOne(ec => ec.Edificio)
                .WithMany()
                .HasForeignKey(ec => ec.IdEdificio)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EdificioCarrera>()
                .HasOne(ec => ec.Carrera)
                .WithMany()
                .HasForeignKey(ec => ec.IdCarrera)
                .OnDelete(DeleteBehavior.Restrict);

            // Reporte
            modelBuilder.Entity<Reporte>()
                .HasOne(r => r.Usuario)
                .WithMany()
                .HasForeignKey(r => r.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reporte>()
                .HasOne(r => r.GestorAsignado)
                .WithMany()
                .HasForeignKey(r => r.IdGestorAsignado)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TokenRecuperacionContrasena>()
                .HasOne(t => t.Usuario)
                .WithMany()
                .HasForeignKey(t => t.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<TokenRecuperacionContrasena>()
                .HasIndex(t => t.TokenHash)
                .IsUnique();

            modelBuilder.Entity<Reporte>()
                .HasOne(r => r.UsuarioEliminacion)
                .WithMany()
                .HasForeignKey(r => r.IdUsuarioEliminacion)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reporte>()
                .HasOne(r => r.Categoria)
                .WithMany()
                .HasForeignKey(r => r.IdCategoria)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reporte>()
                .HasOne(r => r.Espacio)
                .WithMany()
                .HasForeignKey(r => r.IdEspacio)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reporte>()
                .HasOne(r => r.EstadoActual)
                .WithMany()
                .HasForeignKey(r => r.IdEstadoActual)
                .OnDelete(DeleteBehavior.Restrict);

            // HistorialEstado
            modelBuilder.Entity<HistorialEstado>()
                .HasOne(h => h.Reporte)
                .WithMany(r => r.HistorialEstados)
                .HasForeignKey(h => h.IdReporte)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<HistorialEstado>()
                .HasOne(h => h.Estado)
                .WithMany()
                .HasForeignKey(h => h.IdEstado)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<HistorialEstado>()
                .HasOne(h => h.Usuario)
                .WithMany()
                .HasForeignKey(h => h.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);

            // ReporteImagen
            modelBuilder.Entity<ReporteImagen>()
                .HasOne(ri => ri.Reporte)
                .WithMany(r => r.Imagenes)
                .HasForeignKey(ri => ri.IdReporte)
                .OnDelete(DeleteBehavior.Restrict);

            // Comentario
            modelBuilder.Entity<Comentario>()
                .HasOne(c => c.Reporte)
                .WithMany(r => r.Comentarios)
                .HasForeignKey(c => c.IdReporte)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Comentario>()
                .HasOne(c => c.ComentarioPadre).WithMany(c => c.Respuestas)
                .HasForeignKey(c => c.IdComentarioPadre).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReporteLike>().HasKey(l => new { l.IdReporte, l.IdUsuario });
            modelBuilder.Entity<ReporteLike>().HasOne(l => l.Reporte).WithMany(r => r.Likes).HasForeignKey(l => l.IdReporte).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ReporteLike>().HasOne(l => l.Usuario).WithMany().HasForeignKey(l => l.IdUsuario).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ComentarioLike>().HasKey(l => new { l.IdComentario, l.IdUsuario });
            modelBuilder.Entity<ComentarioLike>().HasOne(l => l.Comentario).WithMany(c => c.Likes).HasForeignKey(l => l.IdComentario).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ComentarioLike>().HasOne(l => l.Usuario).WithMany().HasForeignKey(l => l.IdUsuario).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Comentario>()
                .HasOne(c => c.Usuario)
                .WithMany()
                .HasForeignKey(c => c.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);

            // Notificacion
            modelBuilder.Entity<Notificacion>()
                .HasOne(n => n.Usuario)
                .WithMany()
                .HasForeignKey(n => n.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notificacion>()
                .HasOne(n => n.Reporte)
                .WithMany(r => r.Notificaciones)
                .HasForeignKey(n => n.IdReporte)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
