import { useEffect, useState } from 'react';
import { getSolicitudesActivas } from '../api/axiosConfig.js';
import './ServicioPreparandose.css';

const DEMORA_PARA_MOSTRAR_MS = 1500;

function ServicioPreparandose() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let temporizador;

    const actualizarEstado = (evento) => {
      if (evento.detail.solicitudesActivas > 0) {
        temporizador ??= window.setTimeout(() => setVisible(true), DEMORA_PARA_MOSTRAR_MS);
        return;
      }

      window.clearTimeout(temporizador);
      temporizador = undefined;
      setVisible(false);
    };

    window.addEventListener('unah:estado-servicio', actualizarEstado);
    actualizarEstado({ detail: { solicitudesActivas: getSolicitudesActivas() } });
    return () => {
      window.clearTimeout(temporizador);
      window.removeEventListener('unah:estado-servicio', actualizarEstado);
    };
  }, []);

  if (!visible) return null;

  return (
    <aside className="servicio-preparandose" role="status" aria-live="polite">
      <span className="servicio-preparandose-indicador" aria-hidden="true" />
      <span><strong>Preparando el servicio…</strong> Esto puede tomar unos segundos.</span>
    </aside>
  );
}

export default ServicioPreparandose;
