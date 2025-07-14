// app/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { login } from '@/services/auth.service';

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const { accessToken, user } = await login(phoneNumber, password);
            await SecureStore.setItemAsync('token', accessToken);
            router.replace('/(tabs)/dashboard');
        } catch (err: any) {
            Alert.alert('Login failed', err?.response?.message || 'Unknown error');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Where's My Kid? - Parent Login</Text>
            <TextInput
                placeholder="Phone Number"
                style={styles.input}
                keyboardType="phone-pad"
                onChangeText={setPhoneNumber}
                value={phoneNumber}
            />
            <TextInput
                placeholder="Password"
                style={styles.input}
                secureTextEntry
                onChangeText={setPassword}
                value={password}
            />
            <Button title="Login" onPress={handleLogin} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 12,
        marginBottom: 16,
        borderRadius: 6,
    },
});
