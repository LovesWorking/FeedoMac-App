import axios from 'axios';
import { getItem } from '@src/storage/mmkvStorage';


export const API_BASE = "http://10.144.133.55:8000/api";
export const WS_BASE  = "ws://10.144.133.55:8282"; // <-- WebSocket server

const httpApi = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
});

httpApi.interceptors.request.use(async (config) => {
    const token = getItem('token'); // use MMKV
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default httpApi;
