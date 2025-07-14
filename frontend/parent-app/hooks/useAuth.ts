import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export function useAuth() {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const checkToken = async () => {
            const token = await SecureStore.getItemAsync('token');
            setAuthenticated(!!token);
            setLoading(false);
        };
        checkToken();
    }, []);

    return { loading, isAuthenticated };
}
