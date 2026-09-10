import axios from 'axios';

const MAX_REINTENTOS = 3;
const RETRASO_INICIAL_MS = 1500;
const METODOS_REINTENTABLES = new Set(['get', 'head', 'options']);
const ESTADOS_TRANSITORIOS = new Set([408, 429, 502, 503, 504]);

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:7146/api',
});

let solicitudesActivas = 0;

function publicarEstadoServicio() {
    window.dispatchEvent(new CustomEvent('unah:estado-servicio', {
        detail: { solicitudesActivas },
    }));
}

export function getSolicitudesActivas() {
    return solicitudesActivas;
}

function iniciarSeguimiento(config) {
    if (!config.__unahSeguimientoActivo) {
        config.__unahSeguimientoActivo = true;
        solicitudesActivas += 1;
        publicarEstadoServicio();
    }
}

function finalizarSeguimiento(config) {
    if (config?.__unahSeguimientoActivo && !config.__unahSeguimientoFinalizado) {
        config.__unahSeguimientoFinalizado = true;
        solicitudesActivas = Math.max(0, solicitudesActivas - 1);
        publicarEstadoServicio();
    }
}

function esperar(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

apiClient.interceptors.request.use((config) => {
    iniciarSeguimiento(config);
    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        finalizarSeguimiento(response.config);
        return response;
    },
    async (error) => {
        const config = error.config;
        const metodo = config?.method?.toLowerCase();
        const estado = error.response?.status;
        const esErrorTransitorio = !error.response || ESTADOS_TRANSITORIOS.has(estado);
        const reintentos = config?.__unahReintentos ?? 0;

        if (config && METODOS_REINTENTABLES.has(metodo) && esErrorTransitorio && reintentos < MAX_REINTENTOS) {
            config.__unahReintentos = reintentos + 1;
            await esperar(RETRASO_INICIAL_MS * config.__unahReintentos);
            return apiClient(config);
        }

        finalizarSeguimiento(config);
        return Promise.reject(error);
    },
);

export default apiClient;
