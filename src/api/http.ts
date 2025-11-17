import axios from "axios";


export const http = axios.create({
baseURL: "https://your-api.com/api",
timeout: 20000,
});