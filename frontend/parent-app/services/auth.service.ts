import api from './api';
import * as SecureStore from 'expo-secure-store';

export async function login(phoneNumber: string, password: string) {
    try {
        const response = await api.post('/auth/login', {
            phoneNumber,
            password,
        });

        console.log('✅ Login Success:', response.data);

        const { accessToken, user } = response.data;

        await SecureStore.setItemAsync('token', accessToken);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        return { accessToken, user };
    } catch (error: any) {
        console.error('❌ Login Failed:', error?.response?.data || error.message);
        throw error;
    }
}
