import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:7146/api',
});

export default apiClient;
