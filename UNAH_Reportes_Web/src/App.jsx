import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { useUser } from './context/UserContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './components/Login.jsx';
import FeedPage from './pages/FeedPage.jsx';
import CrearReportePage from './pages/CrearReportePage.jsx';
import ReporteDetallePage from './pages/ReporteDetallePage.jsx';
import GestionPage from './pages/GestionPage.jsx';
import NotificacionesPage from './pages/NotificacionesPage.jsx';
import AdministracionCategoriasPage from './pages/AdministracionCategoriasPage.jsx';
import AdministracionCarrerasPage from './pages/AdministracionCarrerasPage.jsx';
import AdministracionEdificiosPage from './pages/AdministracionEdificiosPage.jsx';
import AdministracionTiposEspacioPage from './pages/AdministracionTiposEspacioPage.jsx';
import AdministracionEspaciosPage from './pages/AdministracionEspaciosPage.jsx';
import AdministracionEstadosPage from './pages/AdministracionEstadosPage.jsx';
import AdministracionUsuariosPage from './pages/AdministracionUsuariosPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ColeccionReportesPage from './pages/ColeccionReportesPage.jsx';
import PerfilPage from './pages/PerfilPage.jsx';
import RestablecerContrasenaPage from './pages/RestablecerContrasenaPage.jsx';
import LoadingPage from './components/LoadingPage.jsx';
import ServicioPreparandose from './components/ServicioPreparandose.jsx';
import './App.css';

function RestaurarScroll() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const { usuario, cargando } = useUser();
  return (
    <BrowserRouter>
      <RestaurarScroll />
      {cargando ? <>
        <LoadingPage />
        <ServicioPreparandose />
      </> : !usuario ? <>
        <Routes>
          <Route path="/restablecer-contrasena" element={<RestablecerContrasenaPage />} />
          <Route path="*" element={<Login />} />
        </Routes>
        <ServicioPreparandose />
      </> : <>
      <ServicioPreparandose />
        <Layout>
          <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/crear-reporte" element={<CrearReportePage />} />
          <Route path="/reporte/:id" element={<ReporteDetallePage />} />
          <Route path="/gestion" element={<GestionPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/mis-reportes" element={<ColeccionReportesPage tipo="mios" />} />
          <Route path="/archivados" element={<ColeccionReportesPage tipo="archivados" />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/notificaciones" element={<NotificacionesPage />} />
          <Route path="/administracion/categorias" element={<AdministracionCategoriasPage />} />
          <Route path="/administracion/carreras" element={<AdministracionCarrerasPage />} />
          <Route path="/administracion/edificios" element={<AdministracionEdificiosPage />} />
          <Route path="/administracion/tipos-espacio" element={<AdministracionTiposEspacioPage />} />
          <Route path="/administracion/espacios" element={<AdministracionEspaciosPage />} />
          <Route path="/administracion/estados" element={<AdministracionEstadosPage />} />
          <Route path="/administracion/usuarios" element={<AdministracionUsuariosPage />} />
          </Routes>
        </Layout>
      </>}
    </BrowserRouter>
  );
}

export default App;
