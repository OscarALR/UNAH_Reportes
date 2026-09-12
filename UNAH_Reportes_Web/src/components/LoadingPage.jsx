import { useTheme } from '../context/ThemeContext.jsx';
import RiuvsLogo from './RiuvsLogo.jsx';
import './LoadingPage.css';

function LoadingPage() {
  const { tema } = useTheme();

  return (
    <main className="carga-page" aria-live="polite" aria-busy="true">
      <section className="carga-contenido">
        <RiuvsLogo className="carga-marca" variante={tema === 'dark' ? 'oscura' : 'clara'} mostrarSubtitulo ampliada />
        <div className="carga-indicador" aria-hidden="true"><span /></div>
        <p>Preparando el servicio… Esto puede tomar unos segundos.</p>
      </section>
    </main>
  );
}

export default LoadingPage;
