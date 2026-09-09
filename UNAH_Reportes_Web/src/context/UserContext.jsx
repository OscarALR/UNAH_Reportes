import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken.js';
import apiClient from '../api/axiosConfig.js';

const UserContext = createContext(null);

export function UserProvider({ children }) { 
    const { instance, accounts } = useMsal();
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);

    const cargarUsuario = useCallback(async () => {
        const usuarioLocal = sessionStorage.getItem('unah_local_usuario');
        if (usuarioLocal) {
            setUsuario(JSON.parse(usuarioLocal));
            setCargando(false);
            return;
        }
        try {
            const token = await getAccessToken(instance, accounts);
            const response = await apiClient.get('/usuarios/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsuario(response.data);
        } catch (error) {
            console.error('Error cargando usuario:', error);
        } finally {
            setCargando(false);
        }
    }, [accounts, instance]);

    const iniciarSesionLocal = useCallback((sesion) => {
        sessionStorage.setItem('unah_local_token', sesion.token);
        sessionStorage.setItem('unah_local_usuario', JSON.stringify(sesion.usuario));
        setUsuario(sesion.usuario);
        setCargando(false);
    }, []);

    const cerrarSesionLocal = useCallback(() => {
        sessionStorage.removeItem('unah_local_token');
        sessionStorage.removeItem('unah_local_usuario');
        setUsuario(null);
    }, []);

    const actualizarUsuario = useCallback((usuarioActualizado) => {
        setUsuario(usuarioActualizado);
        if (sessionStorage.getItem('unah_local_token')) {
            sessionStorage.setItem('unah_local_usuario', JSON.stringify(usuarioActualizado));
        }
    }, []);

    useEffect(() => { 
        if (sessionStorage.getItem('unah_local_usuario')) {
            cargarUsuario();
        } else if (accounts.length > 0) { 
            cargarUsuario();
        } else { 
            setCargando(false);
        }
    }, [accounts.length, cargarUsuario]);

    return (
        <UserContext.Provider value={{ usuario, cargando, recargarUsuario: cargarUsuario, iniciarSesionLocal, cerrarSesionLocal, actualizarUsuario }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() { 
    return useContext(UserContext);
}
