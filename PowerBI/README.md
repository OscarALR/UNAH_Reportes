# Dashboard Power BI — UNAH Reportes

Este material acompaña un único archivo `UNAH_Reportes_Dashboard.pbix`. El informe está pensado para uso administrativo y no debe usar **Publicar en web**, porque los reportes contienen información institucional.

## 1. Preparar los datos

1. En SQL Server Management Studio, conectado a la base de datos usada por la API, ejecuta [`01_Vistas_PowerBI.sql`](01_Vistas_PowerBI.sql).
2. En Power BI Desktop selecciona **Obtener datos > SQL Server**.
3. Usa modo **Importar** y carga estas tablas:
   - `vw_PBI_Reportes`
   - `vw_PBI_HistorialEstados`
   - `Categorias`, `Edificios`, `Espacios`, `TiposEspacio`, `Estados`, `Carreras`
4. En Power Query verifica los tipos `FechaCreacionDia`, `FechaUltimaActualizacionDia` y `FechaCambioDia` como **Fecha**; los campos con hora deben conservarse como **Fecha/Hora**.

> La vista toma como fecha de resolución el primer cambio a `Resuelto` o `Cerrado`. Si se usan otros nombres de estados, actualiza esa lista antes de cargarla.

## 2. Modelo de datos

Usa un modelo estrella: `vw_PBI_Reportes` será la tabla de hechos principal; `vw_PBI_HistorialEstados` será la segunda tabla de hechos. Crea estas relaciones de uno a varios y en dirección única desde la dimensión hacia los hechos:

| Dimensión | Clave | Hecho | Clave |
| --- | --- | --- | --- |
| Categorias | IdCategoria | vw_PBI_Reportes | IdCategoria |
| Espacios | IdEspacio | vw_PBI_Reportes | IdEspacio |
| Edificios | IdEdificio | Espacios | IdEdificio |
| TiposEspacio | IdTipoEspacio | Espacios | IdTipoEspacio |
| Estados | IdEstado | vw_PBI_Reportes | IdEstadoActual |
| Estados | IdEstado | vw_PBI_HistorialEstados | IdEstado |
| Carreras | IdCarrera | vw_PBI_Reportes | IdCarreraReportante |
| vw_PBI_Reportes | IdReporte | vw_PBI_HistorialEstados | IdReporte |

Para evitar rutas ambiguas, deja la relación `vw_PBI_Reportes` → `vw_PBI_HistorialEstados` como inactiva si necesitas segmentar ambas tablas por dimensiones independientes; en ese caso usa `TREATAS` en medidas específicas. Para un primer informe, basta usar la vista de reportes en las tres páginas y emplear la de historial solo en tiempos y cambios de estado.

Crea una tabla de fecha en **Modelado > Nueva tabla**:

```DAX
DimFecha =
ADDCOLUMNS(
    CALENDAR(MIN('vw_PBI_Reportes'[FechaCreacionDia]), TODAY()),
    "Año", YEAR([Date]),
    "Mes número", MONTH([Date]),
    "Mes", FORMAT([Date], "MMMM"),
    "Año-Mes", FORMAT([Date], "YYYY-MM")
)
```

Ordena `DimFecha[Mes]` por `DimFecha[Mes número]` y relaciónala con `vw_PBI_Reportes[FechaCreacionDia]`.

## 3. Medidas DAX

Crea una tabla vacía llamada `Medidas` y agrega estas medidas. Ajusta los nombres `Resuelto` y `Cerrado` si tu catálogo de estados utiliza otros.

```DAX
Reportes totales = COUNTROWS('vw_PBI_Reportes')

Reportes cerrados =
CALCULATE(
    [Reportes totales],
    FILTER('vw_PBI_Reportes', 'vw_PBI_Reportes'[EstadoActual] IN { "Resuelto", "Cerrado" })
)

Reportes abiertos = [Reportes totales] - [Reportes cerrados]

Porcentaje cerrados = DIVIDE([Reportes cerrados], [Reportes totales], 0)

Reportes alta prioridad =
CALCULATE([Reportes totales], 'vw_PBI_Reportes'[Prioridad] = "Alta")

Reportes sin gestor =
CALCULATE([Reportes totales], ISBLANK('vw_PBI_Reportes'[IdGestorAsignado]))

Tiempo promedio de resolución (horas) =
AVERAGEX(
    FILTER('vw_PBI_Reportes', NOT ISBLANK('vw_PBI_Reportes'[FechaResolucion])),
    DATEDIFF(
        'vw_PBI_Reportes'[FechaCreacion],
        'vw_PBI_Reportes'[FechaResolucion],
        HOUR
    )
)

Reportes resueltos en SLA 72h =
CALCULATE(
    [Reportes cerrados],
    FILTER(
        'vw_PBI_Reportes',
        NOT ISBLANK('vw_PBI_Reportes'[FechaResolucion]) &&
        DATEDIFF('vw_PBI_Reportes'[FechaCreacion], 'vw_PBI_Reportes'[FechaResolucion], HOUR) <= 72
    )
)

Cumplimiento SLA 72h = DIVIDE([Reportes resueltos en SLA 72h], [Reportes cerrados], 0)

Cambios de estado = COUNTROWS('vw_PBI_HistorialEstados')
```

Formatea `Porcentaje cerrados` y `Cumplimiento SLA 72h` como porcentaje y el tiempo promedio con una decimal.

## 4. Diseño del informe

### Página 1 — Resumen ejecutivo

- Tarjetas: `Reportes totales`, `Reportes abiertos`, `Reportes cerrados`, `Reportes alta prioridad`.
- Gráfico de líneas: `Reportes totales` por `DimFecha[Año-Mes]`.
- Barras apiladas: `Reportes totales` por `EstadoActual` y `Prioridad`.
- Dona: distribución por `Categoria`.
- Segmentadores: año/mes, edificio, categoría, prioridad y estado.

### Página 2 — Operación

- Tarjetas: `Tiempo promedio de resolución (horas)`, `Cumplimiento SLA 72h`, `Reportes sin gestor`.
- Barras: `Reportes abiertos` por `GestorAsignado`.
- Matriz: gestor, categoría, estado y cantidad de reportes.
- Barras: `Cambios de estado` por responsable usando `vw_PBI_HistorialEstados[ResponsableCambio]`.
- Drill-through a detalle de reporte usando `IdReporte`, con título, fechas, estado, gestor y comentario de historial.

### Página 3 — Infraestructura

- Mapa de árbol: `Reportes totales` por `Edificio` y `Espacio`.
- Barras: reportes por `CarreraReportante`.
- Barras: reportes por `TipoEspacio`.
- Tabla: espacio, edificio, categoría, prioridad, estado actual y fecha de creación.
- Segmentadores: edificio, tipo de espacio, carrera, categoría y prioridad.

Agrega botones de navegación entre las páginas y un botón de “volver” en la página de drill-through. Mantén colores de estado consistentes (por ejemplo: rojo para alta prioridad, amarillo para pendiente y verde para resuelto).

## 5. Publicación e integración segura

1. Publica el `.pbix` en un área de trabajo de Power BI Service de la institución.
2. Define quién puede ver el informe; inicialmente, solo administradores.
3. Para incrustarlo en React usa **Power BI Embedded / secure embed con token de inserción**. El backend debe obtener el token mediante una identidad de aplicación; los secretos nunca deben ir en React.
4. Cuando estén disponibles el `workspaceId`, `reportId`, `tenantId` y la modalidad de licenciamiento/capacidad, se crea el endpoint backend que entrega un token efímero solo a administradores y la ruta `/administracion/dashboard` que lo consume.

No uses **Publicar en web**: esa modalidad expone el reporte a cualquier persona que tenga el enlace.
