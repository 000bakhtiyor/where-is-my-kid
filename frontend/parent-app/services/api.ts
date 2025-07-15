// services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const api = axios.create({
    baseURL: 'http://192.168.136.185:3000', // change this if needed
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token'); // or kidToken
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.warn('⛔ Token expired or invalid. Redirecting to login...');
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('kidToken');
            await SecureStore.deleteItemAsync('kid');
            await SecureStore.deleteItemAsync('user');
            router.replace('/login'); // or '/(auth)/login' if you use auth layout
        }
        return Promise.reject(error);
    }
);

export default api;
