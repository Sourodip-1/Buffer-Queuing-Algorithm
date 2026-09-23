import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://329c-2409-40e1-1a-753f-bfc8-d15e-f2fe-d011.ngrok-free.app/';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
