import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faEye,
  faEyeSlash,
  faMoon,
  faSun,
} from '@fortawesome/free-solid-svg-icons';
import { loginRequest } from '../auth/authConfig';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { getCarrerasRegistro, ingresarCuenta, registrarCuenta } from '../api/autenticacionApi';
import { ordenarAlfabeticamente } from '../utils/ordenarAlfabeticamente';
import './Login.css';

function Login() {
  const { instance } = useMsal();
  const { tema, alternarTema } = useTheme();
  const { iniciarSesionLocal } = useUser();
  const [iniciando, setIniciando] = useState(false);
  const [modoLocal, setModoLocal] = useState('ingresar');
  const [carreras, setCarreras] = useState([]);
  const [errorLocal, setErrorLocal] = useState('');
  const [formulario, setFormulario] = useState({ correo: '', contrasena: '', correoRecuperacion: '', nombreCompleto: '', idCarrera: '' });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  useEffect(() => {
    getCarrerasRegistro().then((datos) => setCarreras(ordenarAlfabeticamente(datos, (carrera) => carrera.nombreCarrera))).catch(() => setErrorLocal('No se pudieron cargar las carreras.'));
  }, []);

  const handleLogin = async () => {
    try {
      setIniciando(true);
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setIniciando(false);
    }
  };

  const enviarFormularioLocal = async (e) => {
    e.preventDefault();
    setErrorLocal('');
    if (modoLocal === 'registro' && formulario.nombreCompleto.trim().length < 3) { setErrorLocal('El nombre completo debe tener al menos 3 caracteres.'); return; }
    if (modoLocal === 'registro' && !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(formulario.contrasena)) { setErrorLocal('La contraseña debe tener al menos 8 caracteres e incluir letras, números y símbolos.'); return; }
    setIniciando(true);
    try {
      const sesion = modoLocal === 'registro'
        ? await registrarCuenta({ ...formulario, idCarrera: Number(formulario.idCarrera) })
        : await ingresarCuenta(formulario.correo, formulario.contrasena);
      iniciarSesionLocal(sesion);
    } catch (error) {
      setErrorLocal(error.response?.data || 'No fue posible iniciar sesión.');
    } finally {
      setIniciando(false);
    }
  };

  return (
    <main className="login-page">
      <button
        type="button"
        className="login-theme-toggle"
        onClick={alternarTema}
        title={tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        aria-label={tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
      >
        <FontAwesomeIcon icon={tema === 'light' ? faMoon : faSun} />
      </button>

      <div className="login-contenedor">
        <section className="login-presentacion">
          <img
            className="login-marca"
            src={tema === 'dark' ? '/riuvs-logo-dark-bg.svg' : '/riuvs-logo-horizontal.svg'}
            alt="RiUVS, plataforma de incidencias UNAH VS"
          />

          <div className="login-presentacion-texto">
            <p className="login-etiqueta">Plataforma de incidencias</p>
            <h1>Un campus mejor comienza con un reporte.</h1>
            <p>
              Informa incidencias, consulta su avance y ayuda a mejorar los
              espacios de la comunidad universitaria.
            </p>
          </div>

          <div className="login-beneficios">
            <div><span>01</span><p>Reporta incidencias con fotografías.</p></div>
            <div><span>02</span><p>Da seguimiento a cada cambio de estado.</p></div>
            <div><span>03</span><p>Recibe avisos sobre tus reportes.</p></div>
          </div>
        </section>

        <section className="login-acceso">
          <div className="login-acceso-contenido">
            <img className="login-badge" src="/riuvs-icon.svg" alt="" />
            <p className="login-acceso-etiqueta">Bienvenido</p>
            <h2>{modoLocal === 'registro' ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
            <p className="login-text">Accede con Microsoft o crea una cuenta local para explorar RiUVS.</p>

            <button
              className="login-button"
              type="button"
              onClick={handleLogin}
              disabled={iniciando}
            >
              <span className="login-microsoft-logo" aria-hidden="true">
                <i /><i /><i /><i />
              </span>
              <span>{iniciando ? 'Redirigiendo...' : 'Continuar con Microsoft'}</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>

            <div className="login-separador"><span>o usa una cuenta local</span></div>

            <div className="login-local-tabs">
              <button type="button" className={modoLocal === 'ingresar' ? 'activo' : ''} onClick={() => setModoLocal('ingresar')}>Ingresar</button>
              <button type="button" className={modoLocal === 'registro' ? 'activo' : ''} onClick={() => setModoLocal('registro')}>Registrarme</button>
            </div>

            <form className="login-local-form" onSubmit={enviarFormularioLocal}>
              {modoLocal === 'registro' && <><label>Nombre completo<input required minLength="3" maxLength="150" value={formulario.nombreCompleto} onChange={(e) => setFormulario({ ...formulario, nombreCompleto: e.target.value })} /></label><label>Carrera<select required value={formulario.idCarrera} onChange={(e) => setFormulario({ ...formulario, idCarrera: e.target.value })}><option value="">Selecciona tu carrera</option>{carreras.map((carrera) => <option key={carrera.idCarrera} value={carrera.idCarrera}>{carrera.nombreCarrera}</option>)}</select></label><label>Correo de recuperación<input required type="email" maxLength="150" value={formulario.correoRecuperacion} onChange={(e) => setFormulario({ ...formulario, correoRecuperacion: e.target.value })} /></label></>}
              <label>Correo electrónico<input required type="email" maxLength="150" value={formulario.correo} onChange={(e) => setFormulario({ ...formulario, correo: e.target.value })} /></label>
              <label>Contraseña<span className="campo-contrasena"><input required type={mostrarContrasena ? 'text' : 'password'} minLength="8" value={formulario.contrasena} onChange={(e) => setFormulario({ ...formulario, contrasena: e.target.value })} /><button type="button" onClick={() => setMostrarContrasena((visible) => !visible)} aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}><FontAwesomeIcon icon={mostrarContrasena ? faEyeSlash : faEye} /></button></span>{modoLocal === 'registro' && <small>8+ caracteres, combinando letras, números y símbolos.</small>}</label>
              {modoLocal === 'ingresar' && <button type="button" className="login-recuperar" onClick={() => setErrorLocal('La recuperación por correo está en preparación; contacta a soporte mientras se configura el servicio de correo.')}>¿Olvidaste tu contraseña?</button>}
              {errorLocal && <p className="login-local-error" role="alert">{errorLocal}</p>}
              <button type="submit" className="login-local-button" disabled={iniciando}>{modoLocal === 'registro' ? 'Crear cuenta' : 'Ingresar con correo'}</button>
            </form>

            {import.meta.env.DEV && <p className="login-nota">
              Usuario de prueba: prueba@unahreportes.local · Contraseña: PruebaUNAH2026!
            </p>}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
