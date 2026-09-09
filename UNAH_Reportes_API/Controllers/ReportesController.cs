using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UNAH_Reportes_API.Extensions;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.DTOs;
using UNAH_Reportes_API.Models;

namespace UNAH_Reportes_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportesController : ControllerBase
    {
        private static readonly string[] EstadosFinales = ["Resuelto", "Cerrado"];
        private readonly AppDbContext _context;

        public ReportesController(AppDbContext context) 
        {
            _context = context;
        }

        //GET: api/reportes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReporteDTO>>> GetReportes() 
        {
            var correoToken = User.GetCorreoInstitucional();

            var usuarioActual = await _context.Usuarios
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.CorreoInstitucional == correoToken);

            if (usuarioActual == null)
                return Unauthorized();

            var reportes = await _context.Reportes
                .Include(r => r.Categoria)
                .Include(r => r.Espacio)
                .Include(r => r.EstadoActual)
                .Include(r => r.Usuario)
                .Include(r => r.GestorAsignado)
                .Select(r => new ReporteDTO
                {
                    IdReporte = r.IdReporte,
                    Titulo = r.Titulo,
                    Descripcion = r.Descripcion,
                    Categoria = r.Categoria.NombreCategoria,
                    Espacio = r.Espacio.NombreEspacio,
                    Estado = r.EstadoActual.NombreEstado,
                    Prioridad = r.Prioridad,
                    UsuarioReporta = r.Usuario.NombreCompleto,
                    GestorAsignado = r.GestorAsignado != null ? r.GestorAsignado.NombreCompleto : null,
                    FechaCreacion = r.FechaCreacion
                })
                .ToListAsync();

            return Ok(reportes);
        }


        //GET: api/reportes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ReporteDTO>> GetReporte(int id) 
        {
            var reporte = await _context.Reportes
                .Include(r => r.Categoria)
                .Include(r => r.Espacio)
                .Include(r => r.EstadoActual)
                .Include(r => r.Usuario)
                .Include(r => r.GestorAsignado)
                .Where(r => r.IdReporte == id)
                .Select(r => new ReporteDTO
                {
                    IdReporte = r.IdReporte,
                    Titulo = r.Titulo,
                    Descripcion = r.Descripcion,
                    Categoria = r.Categoria.NombreCategoria,
                    Espacio = r.Espacio.NombreEspacio,
                    Estado = r.EstadoActual.NombreEstado,
                    Prioridad = r.Prioridad,
                    UsuarioReporta = r.Usuario.NombreCompleto,
                    GestorAsignado = r.GestorAsignado != null ? r.GestorAsignado.NombreCompleto : null,
                    FechaCreacion = r.FechaCreacion,
                    Eliminado = r.Eliminado,
                    FechaEliminacion = r.FechaEliminacion,
                    MotivoEliminacion = r.MotivoEliminacion
                })
                .FirstOrDefaultAsync();

            if (reporte == null)
                return NotFound();

            return Ok(reporte);
        }

        [HttpGet("mios")]
        public async Task<ActionResult<IEnumerable<ReporteDTO>>> GetMisReportes()
        {
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();

            return Ok(await _context.Reportes
                .AsNoTracking()
                .Where(r => r.IdUsuario == usuario.IdUsuario && !r.Eliminado)
                .OrderByDescending(r => r.FechaCreacion)
                .Select(r => new ReporteDTO
                {
                    IdReporte = r.IdReporte, Titulo = r.Titulo, Descripcion = r.Descripcion,
                    Categoria = r.Categoria.NombreCategoria, Espacio = r.Espacio.NombreEspacio,
                    Estado = r.EstadoActual.NombreEstado, Prioridad = r.Prioridad,
                    UsuarioReporta = r.Usuario.NombreCompleto,
                    GestorAsignado = r.GestorAsignado == null ? null : r.GestorAsignado.NombreCompleto,
                    FechaCreacion = r.FechaCreacion
                }).ToListAsync());
        }

        [HttpGet("archivados")]
        public async Task<ActionResult<IEnumerable<ReporteDTO>>> GetArchivados([FromQuery] string? tipo, [FromQuery] string? alcance)
        {
            var consulta = _context.Reportes.AsNoTracking().AsQueryable();
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.AsNoTracking().SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();

            if (alcance == "mios") consulta = consulta.Where(r => r.IdUsuario == usuario.IdUsuario);
            else if (alcance == "carrera" && usuario.IdCarrera.HasValue) consulta = consulta.Where(r => r.Usuario.IdCarrera == usuario.IdCarrera);
            consulta = tipo?.ToLowerInvariant() switch
            {
                "eliminados" => consulta.Where(r => r.Eliminado),
                "resueltos" => consulta.Where(r => !r.Eliminado && EstadosFinales.Contains(r.EstadoActual.NombreEstado)),
                _ => consulta.Where(r => r.Eliminado || EstadosFinales.Contains(r.EstadoActual.NombreEstado))
            };

            return Ok(await consulta.OrderByDescending(r => r.Eliminado ? r.FechaEliminacion : r.FechaUltimaActualizacion)
                .Select(r => new ReporteDTO
                {
                    IdReporte = r.IdReporte, Titulo = r.Titulo, Descripcion = r.Descripcion,
                    Categoria = r.Categoria.NombreCategoria, Espacio = r.Espacio.NombreEspacio,
                    Estado = r.EstadoActual.NombreEstado, Prioridad = r.Prioridad,
                    UsuarioReporta = r.Usuario.NombreCompleto,
                    GestorAsignado = r.GestorAsignado == null ? null : r.GestorAsignado.NombreCompleto,
                    FechaCreacion = r.FechaCreacion, Eliminado = r.Eliminado,
                    FechaEliminacion = r.FechaEliminacion, MotivoEliminacion = r.MotivoEliminacion
                }).ToListAsync());
        }

        [HttpPut("{id:int}/archivar")]
        public async Task<IActionResult> ArchivarReporte(int id, ArchivarReporteDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var correo = User.GetCorreoInstitucional();
            var usuario = await _context.Usuarios.Include(u => u.Rol).SingleOrDefaultAsync(u => u.CorreoInstitucional == correo);
            if (usuario == null) return Unauthorized();
            if (usuario.Rol.NombreRol is not ("Gestor" or "Administrador")) return Forbid();

            var reporte = await _context.Reportes.FindAsync(id);
            if (reporte == null) return NotFound();
            if (reporte.Eliminado) return Conflict("El reporte ya fue archivado.");

            reporte.Eliminado = true;
            reporte.FechaEliminacion = DateTime.Now;
            reporte.MotivoEliminacion = dto.Motivo.Trim();
            reporte.IdUsuarioEliminacion = usuario.IdUsuario;
            reporte.FechaUltimaActualizacion = DateTime.Now;
            _context.Notificaciones.Add(new Notificacion
            {
                IdUsuario = reporte.IdUsuario,
                IdReporte = reporte.IdReporte,
                Tipo = "Reporte archivado",
                Mensaje = $"Tu reporte \"{reporte.Titulo}\" fue archivado. Motivo: {reporte.MotivoEliminacion}",
                FechaCreacion = DateTime.Now
            });
            await _context.SaveChangesAsync();
            return NoContent();
        }


        //POST: api/reportes
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ReporteDTO>> CrearReporte(ReporteCrearDTO dto) 
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var correoToken = User.GetCorreoInstitucional();
            var usuarioActual = await _context.Usuarios.FirstOrDefaultAsync(u => u.CorreoInstitucional == correoToken);

            if (usuarioActual == null)
                return Unauthorized("No se encontró un usuario registrado con este correo.");

            var reporte = new Reporte
            {
                IdUsuario = usuarioActual.IdUsuario,
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                IdCategoria = dto.IdCategoria,
                IdEspacio = dto.IdEspacio,
                Prioridad = dto.Prioridad,
                IdEstadoActual = 1,
                FechaCreacion = DateTime.Now,
                FechaUltimaActualizacion = DateTime.Now,
            };

            _context.Reportes.Add(reporte);
            await _context.SaveChangesAsync();

            _context.HistorialEstados.Add(new HistorialEstado
            {
                IdReporte = reporte.IdReporte,
                IdEstado = reporte.IdEstadoActual,
                IdUsuario = usuarioActual.IdUsuario,
                Comentario = "Reporte creado.",
                FechaCambio = DateTime.Now
            });

            await _context.SaveChangesAsync();

            // Volvemos a consultar el reporte recién creado, ya con sus relaciones incluidas
            var reporteCreado = await _context.Reportes
                .Include(r => r.Categoria)
                .Include(r => r.Espacio)
                .Include(r => r.EstadoActual)
                .Include(r => r.Usuario)
                .Include(r => r.GestorAsignado)
                .Where(r => r.IdReporte == reporte.IdReporte)
                .Select(r => new ReporteDTO
                {
                    IdReporte = r.IdReporte,
                    Titulo = r.Titulo,
                    Descripcion = r.Descripcion,
                    Categoria = r.Categoria.NombreCategoria,
                    Espacio = r.Espacio.NombreEspacio,
                    Estado = r.EstadoActual.NombreEstado,
                    Prioridad = r.Prioridad,
                    UsuarioReporta = r.Usuario.NombreCompleto,
                    GestorAsignado = r.GestorAsignado != null ? r.GestorAsignado.NombreCompleto : null,
                    FechaCreacion = r.FechaCreacion
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetReporte), new { id = reporte.IdReporte }, reporteCreado);
        }


        // PUT: api/reportes/5/estado
        [HttpPut("{id}/estado")]
        public async Task<ActionResult<ReporteDTO>> CambiarEstado(int id, CambiarEstadoDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var correoToken = User.GetCorreoInstitucional();
            var usuarioActual = await _context.Usuarios
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.CorreoInstitucional == correoToken);

            if (usuarioActual == null)
                return Unauthorized("No se encontró un usuario registrado con este correo.");

            bool esGestorOAdmin =
                usuarioActual.Rol.NombreRol == "Gestor" ||
                usuarioActual.Rol.NombreRol == "Administrador";

            if (!esGestorOAdmin)
                return Forbid();

            var reporte = await _context.Reportes
                .Include(r => r.EstadoActual)
                .FirstOrDefaultAsync(r => r.IdReporte == id);

            if (reporte == null)
                return NotFound();

            var nuevoEstado = await _context.Estados.FindAsync(dto.IdEstado);
            if (nuevoEstado == null)
                return BadRequest("El estado especificado no existe.");

            // Actualiza el estado actual del reporte
            reporte.IdEstadoActual = dto.IdEstado;
            reporte.FechaUltimaActualizacion = DateTime.Now;

            // Registra el cambio en el historial
            var historial = new HistorialEstado
            {
                IdReporte = id,
                IdEstado = dto.IdEstado,
                IdUsuario = usuarioActual.IdUsuario,
                Comentario = dto.Comentario,
                FechaCambio = DateTime.Now
            };

            _context.HistorialEstados.Add(historial);

            if (reporte.IdUsuario != usuarioActual.IdUsuario)
            {
                var notificacion = new Notificacion
                {
                    IdUsuario = reporte.IdUsuario,
                    IdReporte = reporte.IdReporte,
                    Tipo = "Cambio de estado",
                    Mensaje = $"Tu reporte \"{reporte.Titulo}\" cambió de estado a \"{nuevoEstado.NombreEstado}\".",
                    Leida = false,
                    FechaCreacion = DateTime.Now
                };
                _context.Notificaciones.Add(notificacion);
            }

            await _context.SaveChangesAsync();

            // Devolvemos el reporte actualizado, ya con nombres legibles
            var reporteActualizado = await _context.Reportes
                .Include(r => r.Categoria)
                .Include(r => r.Espacio)
                .Include(r => r.EstadoActual)
                .Include(r => r.Usuario)
                .Include(r => r.GestorAsignado)
                .Where(r => r.IdReporte == id)
                .Select(r => new ReporteDTO
                {
                    IdReporte = r.IdReporte,
                    Titulo = r.Titulo,
                    Descripcion = r.Descripcion,
                    Categoria = r.Categoria.NombreCategoria,
                    Espacio = r.Espacio.NombreEspacio,
                    Estado = r.EstadoActual.NombreEstado,
                    Prioridad = r.Prioridad,
                    UsuarioReporta = r.Usuario.NombreCompleto,
                    GestorAsignado = r.GestorAsignado != null ? r.GestorAsignado.NombreCompleto : null,
                    FechaCreacion = r.FechaCreacion
                })
                .FirstOrDefaultAsync();

            return Ok(reporteActualizado);
        }


        // PUT: api/reportes/5/asignar
        [HttpPut("{id}/asignar")]
        public async Task<ActionResult<ReporteDTO>> AsignarGestor(int id, AsignarGestorDTO dto)
        {
            var correoToken = User.GetCorreoInstitucional();

            var usuarioActual = await _context.Usuarios
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.CorreoInstitucional == correoToken);

            if (usuarioActual == null)
                return Unauthorized();

            bool esGestorOAdmin =
                usuarioActual.Rol.NombreRol == "Gestor" ||
                usuarioActual.Rol.NombreRol == "Administrador";

            if (!esGestorOAdmin)
                return Forbid();

            var reporte = await _context.Reportes.FindAsync(id);

            if (reporte == null)
                return NotFound();

            reporte.IdGestorAsignado = dto.IdGestorAsignado;
            reporte.FechaUltimaActualizacion = DateTime.Now;

            await _context.SaveChangesAsync();

            var reporteActualizado = await _context.Reportes
                .Include(r => r.Categoria)
                .Include(r => r.Espacio)
                .Include(r => r.EstadoActual)
                .Include(r => r.Usuario)
                .Include(r => r.GestorAsignado)
                .Where(r => r.IdReporte == id)
                .Select(r => new ReporteDTO
                {
                    IdReporte = r.IdReporte,
                    Titulo = r.Titulo,
                    Descripcion = r.Descripcion,
                    Categoria = r.Categoria.NombreCategoria,
                    Espacio = r.Espacio.NombreEspacio,
                    Estado = r.EstadoActual.NombreEstado,
                    Prioridad = r.Prioridad,
                    UsuarioReporta = r.Usuario.NombreCompleto,
                    GestorAsignado = r.GestorAsignado != null ? r.GestorAsignado.NombreCompleto : null,
                    FechaCreacion = r.FechaCreacion
                })
                .FirstOrDefaultAsync();

            return Ok(reporteActualizado);
        }

        // GET: api/reportes/feed/5
        [HttpGet("feed/{idUsuario}")]
        public async Task<ActionResult<IEnumerable<FeedReporteDTO>>> GetFeed(int idUsuario)
        {
            var correoToken = User.GetCorreoInstitucional();

            var usuario = await _context.Usuarios.FindAsync(idUsuario);
            if (usuario == null)
                return NotFound($"No existe un usuario con ID {idUsuario}");

            if (usuario.CorreoInstitucional != correoToken)
                return Forbid();

            // Si el usuario no tiene carrera (ej. personal administrativo), no hay relevancia especial — feed normal
            if (usuario.IdCarrera == null)
            {
                var reportesSinPrioridad = await _context.Reportes
                    .Include(r => r.Categoria)
                    .Include(r => r.Espacio)
                    .Include(r => r.EstadoActual)
                    .Include(r => r.Usuario)
                    .Include(r => r.GestorAsignado)
                    .Where(r => !r.Eliminado && !EstadosFinales.Contains(r.EstadoActual.NombreEstado))
                    .OrderByDescending(r => r.FechaCreacion)
                    .Select(r => new FeedReporteDTO
                    {
                        IdReporte = r.IdReporte,
                        Titulo = r.Titulo,
                        Descripcion = r.Descripcion,
                        Categoria = r.Categoria.NombreCategoria,
                        Espacio = r.Espacio.NombreEspacio,
                        Estado = r.EstadoActual.NombreEstado,
                        Prioridad = r.Prioridad,
                        UsuarioReporta = r.Usuario.NombreCompleto,
                        GestorAsignado = r.GestorAsignado != null ? r.GestorAsignado.NombreCompleto : null,
                        FechaCreacion = r.FechaCreacion,
                        EsRelevante = false
                    })
                    .ToListAsync();

                return Ok(reportesSinPrioridad);
            }

            int idCarrera = usuario.IdCarrera.Value;

            // IDs de categorías relevantes para su carrera
            var categoriasRelevantes = await _context.CategoriaCarreras
                .Where(cc => cc.IdCarrera == idCarrera)
                .Select(cc => cc.IdCategoria)
                .ToListAsync();

            // IDs de edificios relevantes para su carrera
            var edificiosRelevantes = await _context.EdificioCarreras
                .Where(ec => ec.IdCarrera == idCarrera)
                .Select(ec => ec.IdEdificio)
                .ToListAsync();

            var reportes = await _context.Reportes
                .Include(r => r.Categoria)
                .Include(r => r.Espacio)
                .Include(r => r.EstadoActual)
                .Include(r => r.Usuario)
                .Include(r => r.GestorAsignado)
                .Where(r => !r.Eliminado && !EstadosFinales.Contains(r.EstadoActual.NombreEstado))
                .Select(r => new FeedReporteDTO
                {
                    IdReporte = r.IdReporte,
                    Titulo = r.Titulo,
                    Descripcion = r.Descripcion,
                    Categoria = r.Categoria.NombreCategoria,
                    Espacio = r.Espacio.NombreEspacio,
                    Estado = r.EstadoActual.NombreEstado,
                    Prioridad = r.Prioridad,
                    UsuarioReporta = r.Usuario.NombreCompleto,
                    GestorAsignado = r.GestorAsignado != null ? r.GestorAsignado.NombreCompleto : null,
                    FechaCreacion = r.FechaCreacion,
                    EsRelevante = categoriasRelevantes.Contains(r.IdCategoria) ||
                                  (r.Espacio.IdEdificio != null && edificiosRelevantes.Contains(r.Espacio.IdEdificio.Value))
                })
                .OrderByDescending(r => r.EsRelevante)
                .ThenByDescending(r => r.FechaCreacion)
                .ToListAsync();

            return Ok(reportes);
        }
    }
}
