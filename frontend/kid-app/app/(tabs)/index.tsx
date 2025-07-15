import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';

export default function KidDashboard() {
  const [kid, setKid] = useState<{ id: string; fullName: string; profileImage?: string } | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [batteryLevel] = useState(Math.floor(60 + Math.random() * 40)); // Simulated
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('kid');
      if (storedUser) {
        const kidData = JSON.parse(storedUser);
        setKid({
          ...kidData,
          profileImage: kidData.profileImage || 'https://randomuser.me/api/portraits/kid/1.jpg'
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const sendLocation = async (coords: { latitude: number; longitude: number }) => {
    const token = await SecureStore.getItemAsync('kidToken');
    try {
      await api.post(
        '/location',
        {
          latitude: coords.latitude,
          longitude: coords.longitude
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (err) {
      console.error('Failed to send location:', err);
    }
  };

  const updateLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ruxsat berilmagan', 'Joylashuvga ruxsat kerak.');
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude
    };

    setLocation(coords);
    await sendLocation(coords);
  };

  const markSafe = async () => {
    const kidToken = await SecureStore.getItemAsync('kidToken');
    const kid = await SecureStore.getItemAsync('kid');
    const id = kid ? JSON.parse(kid).id : null;
    try {
      await api.post('/status/safe', {id}, {
        headers: { Authorization: `Bearer ${kidToken}` }
      });
      Alert.alert('✅ Xavfsiz', 'Siz xavfsiz deb belgilandingiz.');
    } catch (err) {
      Alert.alert('❌ Xatolik', 'Serverga murojaat amalga oshmadi.');
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('kid');
    router.replace('/login');
  };

  useEffect(() => {
    const load = async () => {
      await fetchProfile();
      await updateLocation();
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ marginTop: 12 }}>Yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Salom,</Text>
          <Text style={styles.kidName}>{kid?.fullName || 'bola'} 👋</Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
          <Image source={{ uri: kid?.profileImage }} style={styles.profileImage} />
        </View>
      </View>

      {/* Location Card */}
      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <Ionicons name="location-outline" size={24} color="#4A90E2" />
        </View>
        <View>
          <Text style={styles.cardLabel}>Joylashuv</Text>
          {location ? (
            <Text style={styles.cardValue}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.cardValue}>Aniqlanmayapti...</Text>
          )}
        </View>
      </View>

      {/* Battery Card */}
      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <Ionicons name="battery-half" size={24} color="#f59e0b" />
        </View>
        <View>
          <Text style={styles.cardLabel}>Batareya</Text>
          <Text style={styles.cardValue}>{batteryLevel}% (simulyatsiya)</Text>
        </View>
      </View>

      {/* Safe Button */}
      <TouchableOpacity style={styles.safeButton} onPress={markSafe}>
        <Ionicons name="shield-checkmark" size={24} color="#fff" />
        <Text style={styles.safeButtonText}>Men xavfsizman</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sosButton} onPress={() => {
        Alert.alert('❗️ SOS', 'Favqulodda vaziyatda yordam so‘rashingiz mumkin.');
      }}>
        <Ionicons name="alert-circle" size={24} color="#fff" />
        <Text style={styles.sosButtonText}>Yordam chaqirish</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 20
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  greeting: {
    fontSize: 18,
    color: '#64748b'
  },
  kidName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginLeft: 10,
    borderWidth: 2,
    borderColor: '#4A90E2'
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    marginRight: 6
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    alignItems: 'center'
  },
  cardIcon: {
    marginRight: 14
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2'
  },
  cardValue: {
    fontSize: 15,
    color: '#334155',
    marginTop: 4
  },
  safeButton: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30
  },
  safeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10
  },
  sosButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10
  }

});
