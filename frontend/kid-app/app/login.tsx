import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import api from '@/services/api';

export default function KidLoginScreen() {
  const [setupToken, setSetupToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleLogin = async () => {
    if (!setupToken.trim()) {
      Alert.alert('Xatolik', 'Token kiriting');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/kid/login', { setupToken });
      // The backend returns { accessToken, user }
      const { accessToken, user } = response.data;

      await SecureStore.setItemAsync('kidToken', accessToken);
      await SecureStore.setItemAsync('kid', JSON.stringify(user));

      router.replace('/(tabs)');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Xatolik', err.response?.data?.message || 'Login xatoligi');
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (!result?.data) return;
    setScannerVisible(false);
    setSetupToken(result.data);
    handleLogin();
  };

  if (scannerVisible) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerText}>QR kodni skanerlang</Text>
          </View>
        </CameraView>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setScannerVisible(false)}
        >
          <Ionicons name="close" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-child" size={100} color="#6C63FF" />
        <Text style={styles.title}>Bolalar Kirishi</Text>
        <Text style={styles.subtitle}>
          Ota-onangiz QR kodni bersin yoki sozlama tokenini kiriting
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Sozlama tokeni"
          value={setupToken}
          onChangeText={setSetupToken}
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => {
            if (!permission?.granted) {
              Linking.openSettings();
            } else {
              setScannerVisible(true);
            }
          }}
        >
          <Ionicons name="qr-code" size={28} color="#FFF" />
          <Text style={styles.qrButtonText}>QR kodni skanerlang</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.loginButtonText}>KIRISH</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f8fafc' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10 },
  formContainer: { marginBottom: 30 },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  qrButton: {
    flexDirection: 'row',               
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  qrButtonText: { color: '#FFF', fontSize: 16, marginLeft
: 10 },
  loginButton: {
    backgroundColor: '#6C63FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',     
    justifyContent: 'center',
  },
  loginButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scannerOverlay: { flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,   
    borderColor: '#6C63FF',
    borderRadius: 8,        
    marginBottom: 20,
  },
  scannerText: { color: '#FFF', fontSize: 18, marginBottom: 20  },
  closeButton: {    
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    padding: 10,
  },
  closeButtonText: { color: '#FFF', fontSize: 18 },
});