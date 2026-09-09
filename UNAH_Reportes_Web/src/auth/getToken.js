import { loginRequest } from './authConfig.js';

export async function getAccessToken(instance, accounts) { 
    const tokenLocal = sessionStorage.getItem('unah_local_token');
    if (tokenLocal) return tokenLocal;

    const request = { 
        ...loginRequest,
        account: accounts[0],
    };

    try { 
        const response = await instance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        console.error('Error obteniendo token silenciosamente:', error);
        const response = await instance.acquireTokenRedirect(request);
        return response.accessToken;
    }
}
