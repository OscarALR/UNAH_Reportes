function RiuvsLogo({ className, variante = 'clara', decorativo = false, sinIcono = false, mostrarSubtitulo = !['oscura'].includes(variante), ampliada = false, marcaAlturaIcono = false }) {
  const esOscuro = variante === 'oscura';
  const colorTexto = esOscuro ? '#F8FAFC' : '#12213F';
  const posicionTexto = sinIcono ? 0 : 72;
  const tamanoMarca = ampliada ? 52 : marcaAlturaIcono ? 76 : 38;
  const lineaMarca = ampliada ? 48 : marcaAlturaIcono ? 63 : 46;
  const lineaSubtitulo = ampliada ? 74 : 66;

  return (
    <svg
      className={className}
      viewBox="0 0 320 80"
      role={decorativo ? undefined : 'img'}
      aria-hidden={decorativo || undefined}
      aria-label={decorativo ? undefined : 'RiUVS, reporte de incidencias UNAH VS'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>RiUVS</title>
      {!sinIcono && <g transform="translate(0 12)">
        <rect width="56" height="56" rx="14" fill="#F5A623" />
        <circle cx="28" cy="28" r="21" fill="none" stroke="#12213F" strokeWidth="2.5" />
        <circle cx="28" cy="28" r="16" fill="none" stroke="#12213F" />
        <ellipse cx="28" cy="33" rx="6" ry="5" fill="#12213F" />
        <ellipse cx="19.5" cy="23.5" rx="2.5" ry="3.3" fill="#12213F" transform="rotate(-15 19.5 23.5)" />
        <ellipse cx="25" cy="19.5" rx="2.5" ry="3.3" fill="#12213F" transform="rotate(-5 25 19.5)" />
        <ellipse cx="31" cy="19.5" rx="2.5" ry="3.3" fill="#12213F" transform="rotate(5 31 19.5)" />
        <ellipse cx="36.5" cy="23.5" rx="2.5" ry="3.3" fill="#12213F" transform="rotate(15 36.5 23.5)" />
        <circle cx="28" cy="7" r="1.3" fill="#12213F" />
        <circle cx="28" cy="49" r="1.3" fill="#12213F" />
        <circle cx="7" cy="28" r="1.3" fill="#12213F" />
        <circle cx="49" cy="28" r="1.3" fill="#12213F" />
      </g>}
      <text x={posicionTexto} y={lineaMarca} fill={colorTexto} fontFamily="Sora, Arial, sans-serif" fontSize={tamanoMarca} fontWeight="800" letterSpacing="-1.1">Ri<tspan fill="#F5A623">U</tspan>VS</text>
      {mostrarSubtitulo && <text x={posicionTexto} y={lineaSubtitulo} fill={esOscuro ? '#C7D4E9' : '#6B7280'} fontFamily="Manrope, Arial, sans-serif" fontSize={ampliada ? 16 : 13} fontWeight="600">Reporte de Incidencias UNAH VS</text>}
    </svg>
  );
}

export default RiuvsLogo;
