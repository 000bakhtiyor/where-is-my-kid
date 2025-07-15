// hooks/useAuthGuard.ts
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export const useAuthGuard = () => {
    useEffect(() => {
        const verify = async () => {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                router.replace('/login');
            }
        };
        verify();
    }, []);
};
