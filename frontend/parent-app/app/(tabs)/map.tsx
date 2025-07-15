import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    Platform,
    StatusBar,
    ScrollView,
    Animated,
    Easing
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import * as SecureStore from 'expo-secure-store';
import api from '@/services/api';

// Constants
const { width, height } = Dimensions.get('window');
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * (width / height);
const FETCH_INTERVAL = 10000;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight;
const DEFAULT_REGION = { latitude: 41.31, longitude: 69.24 };

// Types
type KidLocation = {
    id: string;
    kidId: string;
    fullName: string;
    latitude: number;
    longitude: number;
    createdAt: string;
    batteryLevel?: number;
    deviceStatus?: 'online' | 'offline' | 'low-battery';
};

type SafeZone = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
};

export default function MapScreen() {
    const [locations, setLocations] = useState<KidLocation[]>([]);
    const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKid, setSelectedKid] = useState<KidLocation | null>(null);
    const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard');
    const [showSafeZones, setShowSafeZones] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const mapRef = useRef<MapView>(null);
    const cardRef = useRef<any>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation for markers
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true
                })
            ])
        ).start();
    }, []);

    const formatTimeDifference = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
        if (diff < 1) return 'Hozir';
        if (diff < 60) return `${diff} daqiqa oldin`;
        if (diff < 1440) return `${Math.floor(diff / 60)} soat oldin`;
        return `${Math.floor(diff / 1440)} kun oldin`;
    };

    const getDeviceStatus = (kid: KidLocation): KidLocation['deviceStatus'] => {
        if (!kid.batteryLevel) return 'online';
        if (kid.batteryLevel < 15) return 'low-battery';
        return 'online';
    };

    const fetchLocations = useCallback(async () => {
        try {
            const res = await api.get('/location/my-kids/latest');
            const updated = res.data.map((loc: KidLocation) => ({
                ...loc,
                deviceStatus: getDeviceStatus(loc),
            }));
            setLocations(updated);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (e) {
            console.error('Error fetching locations:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchSafeZones = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            const res = await api.get('/zones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSafeZones(res.data);
        } catch (e) {
            console.error('Error fetching zones:', e);
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLocations();
    }, [fetchLocations]);

    useEffect(() => {
        fetchLocations();
        fetchSafeZones();
        const interval = setInterval(fetchLocations, FETCH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchLocations]);

    const handleMarkerPress = (kid: KidLocation) => {
        setSelectedKid(kid);
        mapRef.current?.animateCamera({
            center: {
                latitude: kid.latitude,
                longitude: kid.longitude,
            },
            zoom: 15,
            heading: 0,
            pitch: 0,
            altitude: 0,
        }, { duration: 500 });

        cardRef.current?.fadeInUp?.(700);
    };

    const focusAllKids = useCallback(() => {
        if (!locations.length) return;

        const coordinates = locations.map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude
        }));

        mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, bottom: 300, left: 60, right: 60 },
            animated: true,
        });
    }, [locations]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online': return 'wifi';
            case 'offline': return 'wifi-off';
            case 'low-battery': return 'battery-alert';
            default: return 'wifi';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return '#10B981';
            case 'offline': return '#EF4444';
            case 'low-battery': return '#F59E0B';
            default: return '#6C63FF';
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={{ marginTop: 10 }}>Yuklanmoqda...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {/* Map */}
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    ...DEFAULT_REGION,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                }}
                mapType={mapType}
                showsUserLocation
                showsMyLocationButton={false}
                onPress={() => {
                    cardRef.current?.fadeOutDown?.(300).then(() => setSelectedKid(null));
                }}
            >
                {locations.map(loc => {
                    const isSelected = selectedKid?.kidId === loc.kidId;
                    return (
                        <Marker
                            key={loc.kidId}
                            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                            onPress={() => handleMarkerPress(loc)}
                        >
                            <Animated.View style={[
                                styles.marker,
                                {
                                    backgroundColor: getStatusColor(loc.deviceStatus || 'online'),
                                    transform: [{ scale: isSelected ? pulseAnim : 1 }]
                                },
                                isSelected && styles.selectedMarker
                            ]}>
                                <Icon
                                    name={getStatusIcon(loc.deviceStatus || 'online')}
                                    size={20}
                                    color="#fff"
                                />
                            </Animated.View>
                        </Marker>
                    );
                })}

                {showSafeZones && safeZones.map(zone => (
                    <Circle
                        key={zone.id}
                        center={{ latitude: zone.latitude, longitude: zone.longitude }}
                        radius={zone.radius}
                        fillColor="rgba(76,175,80,0.15)"
                        strokeColor="#4CAF50"
                        strokeWidth={1.5}
                    />
                ))}
            </MapView>

            {/* Header */}
            <Animatable.View
                animation="fadeInDown"
                duration={500}
                style={styles.mapHeader}
            >
                <View style={styles.headerTop}>
                    <Text style={styles.mapTitle}>📍 Xarita</Text>
                    <Text style={styles.mapSubtitle}>
                        {locations.length} bola | Oxirgi yangilanish: {lastUpdated}
                    </Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.kidList}
                    contentContainerStyle={styles.kidListContent}
                >
                    {locations.map(loc => (
                        <TouchableOpacity
                            key={loc.kidId}
                            onPress={() => handleMarkerPress(loc)}
                            style={[
                                styles.kidChip,
                                selectedKid?.kidId === loc.kidId && styles.selectedChip
                            ]}
                        >
                            <Text style={styles.kidName}>{loc.fullName}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animatable.View>

            {/* Controls */}
            <Animatable.View
                animation="fadeInRight"
                duration={500}
                style={styles.controls}
            >
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <ActivityIndicator size="small" color="#6C63FF" />
                    ) : (
                        <Icon name="refresh" size={22} color="#6C63FF" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={focusAllKids}>
                    <Icon name="crosshairs-gps" size={22} color="#6C63FF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={() => setMapType(t => t === 'standard' ? 'hybrid' : 'standard')}>
                    <Icon name={mapType === 'standard' ? "satellite-variant" : "map"} size={22} color="#6C63FF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={() => setShowSafeZones(v => !v)}>
                    <Icon
                        name={showSafeZones ? "shield-check" : "shield-off"}
                        size={22}
                        color={showSafeZones ? '#4CAF50' : '#6C63FF'}
                    />
                </TouchableOpacity>
            </Animatable.View>

            {/* Kid Info Card */}
            {selectedKid && (
                <Animatable.View
                    ref={cardRef}
                    animation="fadeInUp"
                    duration={500}
                    style={styles.infoCard}
                >
                    <View style={styles.infoHeader}>
                        <Text style={styles.infoTitle}>{selectedKid.fullName}</Text>
                        <TouchableOpacity onPress={() => {
                            cardRef.current?.fadeOutDown?.(300).then(() => setSelectedKid(null));
                        }}>
                            <Icon name="close" size={24} color="#4A5568" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoRow}>
                        <Icon name="clock-outline" size={16} color="#4A5568" />
                        <Text style={styles.infoText}>{formatTimeDifference(selectedKid.createdAt)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Icon name="map-marker" size={16} color="#4A5568" />
                        <Text style={styles.infoText}>
                            {selectedKid.latitude.toFixed(6)}, {selectedKid.longitude.toFixed(6)}
                        </Text>
                    </View>

                    {selectedKid.batteryLevel && (
                        <View style={styles.infoRow}>
                            <Icon
                                name={
                                    selectedKid.batteryLevel > 75 ? 'battery-high' :
                                        selectedKid.batteryLevel > 40 ? 'battery-medium' : 'battery-low'
                                }
                                size={16}
                                color={
                                    selectedKid.batteryLevel > 40 ? '#10B981' : '#EF4444'
                                }
                            />
                            <Text style={styles.infoText}>{selectedKid.batteryLevel}%</Text>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Icon
                            name={getStatusIcon(selectedKid.deviceStatus || 'online')}
                            size={16}
                            color={getStatusColor(selectedKid.deviceStatus || 'online')}
                        />
                        <Text style={[
                            styles.infoText,
                            { color: getStatusColor(selectedKid.deviceStatus || 'online') }
                        ]}>
                            {selectedKid.deviceStatus === 'online' ? 'Onlayn' :
                                selectedKid.deviceStatus === 'low-battery' ? 'Batareya past' :
                                    'Offlayn'}
                        </Text>
                    </View>
                </Animatable.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    mapHeader: {
        position: 'absolute',
        top: STATUS_BAR_HEIGHT,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 10,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    headerTop: {
        marginBottom: 8
    },
    mapTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white'
    },
    mapSubtitle: {
        fontSize: 14,
        color: '#E2E8F0',
        marginTop: 4
    },
    kidList: {
        maxHeight: 40,
    },
    kidListContent: {
        paddingVertical: 2
    },
    kidChip: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    selectedChip: {
        backgroundColor: '#6C63FF',
    },
    kidName: {
        fontSize: 13,
        fontWeight: '500',
        color: '#2D3748',
    },
    marker: {
        padding: 8,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    selectedMarker: {
        borderWidth: 3,
        borderColor: '#6C63FF',
        shadowColor: '#6C63FF',
        shadowRadius: 8,
        shadowOpacity: 0.6,
    },
    fab: {
        backgroundColor: 'white',
        borderRadius: 24,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    controls: {
        position: 'absolute',
        right: 16,
        bottom: 120,
    },
    infoCard: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    infoText: {
        fontSize: 15,
        color: '#4A5568',
        marginLeft: 10,
    },
});