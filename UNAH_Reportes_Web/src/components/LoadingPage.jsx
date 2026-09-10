import './LoadingPage.css';

function LoadingPage() {
  return (
    <main className="carga-page" aria-live="polite" aria-busy="true">
      <section className="carga-contenido">
        <div className="carga-emblema" aria-hidden="true">U</div>
        <div className="carga-indicador" aria-hidden="true"><span /></div>
        <h1>UNAH Reportes</h1>
        <p>Preparando el servicio… Esto puede tomar unos segundos.</p>
      </section>
    </main>
  );
}

export default LoadingPage;
