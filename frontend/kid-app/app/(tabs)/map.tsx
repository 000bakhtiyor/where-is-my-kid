import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import api from '@/services/api';

const screen = Dimensions.get('window');

export default function MapScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Ruxsat yo‘q', 'Iltimos, joylashuvga ruxsat bering.');
                return null;
            }
            return await Location.getCurrentPositionAsync({});
        } catch (error) {
            Alert.alert('Xatolik', 'Joylashuvni aniqlab bo‘lmadi.');
            return null;
        }
    };

    const sendLocation = async () => {
        setSending(true);
        try {
            const currentLocation = await getCurrentLocation();
            if (!currentLocation) return;

            const token = await SecureStore.getItemAsync('kidToken');
            if (!token) {
                Alert.alert('Token topilmadi', 'Iltimos qayta tizimga kiring.');
                return;
            }

            await api.post(
                '/location',
                {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setLocation(currentLocation);
            setLastUpdate(new Date().toLocaleTimeString());
            Alert.alert('✅ Yuborildi', 'Joylashuv yuborildi!');
        } catch (error) {
            console.error('Joylashuvni yuborishda xatolik:', error);
            Alert.alert('❌ Xatolik', 'Joylashuv yuborilmadi.');
        } finally {
            setSending(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        sendLocation(); // send once on mount
    }, []);

    if (loading || !location) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={{ marginTop: 12 }}>Joylashuv aniqlanmoqda...</Text>
            </View>
        );
    }

    const { latitude, longitude } = location.coords;

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                <Marker
                    coordinate={{ latitude, longitude }}
                    title="Siz"
                    description="Hozirgi joylashuv"
                />
                <Circle
                    center={{ latitude, longitude }}
                    radius={50}
                    strokeColor="#4A90E2"
                    fillColor="rgba(74,144,226,0.2)"
                />
            </MapView>

            <View style={styles.statusBox}>
                <Text style={styles.statusText}>Oxirgi yuborish: {lastUpdate || '...'}</Text>
            </View>

            <TouchableOpacity
                style={styles.sendButton}
                onPress={sendLocation}
                disabled={sending}
            >
                <Text style={styles.sendButtonText}>
                    {sending ? 'Yuborilmoqda...' : '📍 Joylashuvni yuborish'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        width: screen.width,
        height: screen.height,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBox: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    statusText: {
        color: '#4A90E2',
        fontSize: 14,
        fontWeight: '600',
    },
    sendButton: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: '#4A90E2',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    sendButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});
