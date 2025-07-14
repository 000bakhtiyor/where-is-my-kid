import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    Platform,
    StatusBar
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, LatLng } from 'react-native-maps';
import api from '@/services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';

// Constants
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const FETCH_INTERVAL = 10000;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight;

// Types
type KidLocation = {
    lastUpdate: string;
    id: string;
    kidId: string;
    fullName: string;
    latitude: number;
    longitude: number;
    createdAt: string;
    batteryLevel?: number;
    deviceStatus?: 'online' | 'offline' | 'low-battery';
};

// Dark Map Theme
const MAP_DARK_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

export default function MapScreen() {
    // State
    const [locations, setLocations] = useState<KidLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedKid, setSelectedKid] = useState<KidLocation | null>(null);
    const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard');
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const mapRef = useRef<MapView>(null);
    const isMountedRef = useRef(true);
    const cardRef = useRef<any>(null);

    // Format time difference
    const formatTimeDifference = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
        return `${Math.floor(diffInMinutes / 1440)} days ago`;
    };

    // Fetch locations
    const fetchLocations = useCallback(async () => {
        try {
            const res = await api.get('/location/my-kids/latest');
            if (isMountedRef.current) {
                const updatedLocations = res.data.map((loc: KidLocation) => ({
                    ...loc,
                    lastUpdate: formatTimeDifference(loc.createdAt),
                    deviceStatus: getDeviceStatus(loc)
                }));

                setLocations(updatedLocations);
                setError(null);
                setLastUpdated(new Date().toLocaleTimeString());
            }
        } catch (err) {
            if (isMountedRef.current) {
                setError('Failed to load locations');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    // Determine device status
    const getDeviceStatus = (kid: KidLocation): KidLocation['deviceStatus'] => {
        if (!kid.batteryLevel) return 'online';
        if (kid.batteryLevel < 15) return 'low-battery';
        return 'online';
    };

    // Effects
    useEffect(() => {
        isMountedRef.current = true;
        fetchLocations();

        const interval = setInterval(fetchLocations, FETCH_INTERVAL);
        return () => {
            isMountedRef.current = false;
            clearInterval(interval);
        };
    }, [fetchLocations]);

    // Handlers
    const handleRefresh = () => {
        setRefreshing(true);
        fetchLocations();
    };

    const handleMarkerPress = (kid: KidLocation) => {
        setSelectedKid(kid);
        cardRef.current?.bounceIn();

        mapRef.current?.animateToRegion({
            latitude: kid.latitude,
            longitude: kid.longitude,
            latitudeDelta: LATITUDE_DELTA / 4,
            longitudeDelta: LONGITUDE_DELTA / 4,
        }, 500);
    };

    const handleMapPress = () => {
        setSelectedKid(null);
    };

    const toggleMapType = () => {
        setMapType(prev => prev === 'standard' ? 'hybrid' : 'standard');
    };

    const focusOnAllKids = () => {
        if (locations.length === 0) return;

        const coordinates: LatLng[] = locations.map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude
        }));

        mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
            animated: true,
        });
    };

    // Render loading state
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={styles.loadingText}>Loading children locations...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Map View */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    ...DEFAULT_REGION,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                }}
                customMapStyle={mapType === 'standard' ? MAP_DARK_STYLE : undefined}
                mapType={mapType}
                onPress={handleMapPress}
                toolbarEnabled={false}
            >
                {locations.map((loc) => (
                    <Marker
                        key={loc.kidId}
                        coordinate={{
                            latitude: loc.latitude,
                            longitude: loc.longitude,
                        }}
                        onPress={() => handleMarkerPress(loc)}
                    >
                        <Animatable.View
                            animation={selectedKid?.kidId === loc.kidId ? 'pulse' : undefined}
                            duration={1000}
                            style={[
                                styles.markerContainer,
                                selectedKid?.kidId === loc.kidId && styles.selectedMarker
                            ]}
                        >
                            <View style={[
                                styles.avatar,
                                loc.deviceStatus === 'offline' && styles.offlineAvatar,
                                loc.deviceStatus === 'low-battery' && styles.lowBatteryAvatar
                            ]}>
                                <Icon
                                    name={
                                        loc.deviceStatus === 'offline' ? 'wifi-off' :
                                            loc.deviceStatus === 'low-battery' ? 'battery-alert' :
                                                'human-child'
                                    }
                                    size={24}
                                    color="white"
                                />
                            </View>
                            {selectedKid?.kidId === loc.kidId && (
                                <Animatable.View
                                    animation="fadeInUp"
                                    duration={500}
                                    style={styles.markerLabel}
                                >
                                    <Text style={styles.markerName} numberOfLines={1}>
                                        {loc.fullName}
                                    </Text>
                                </Animatable.View>
                            )}
                        </Animatable.View>
                    </Marker>
                ))}
            </MapView>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Children Locations</Text>
                <Text style={styles.headerSubtitle}>
                    Tracking {locations.length} {locations.length === 1 ? 'child' : 'children'}
                </Text>
            </View>

            {/* Map Controls */}
            <Animatable.View
                animation="fadeInRight"
                duration={500}
                style={styles.controlsContainer}
            >
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleRefresh}
                >
                    <Icon
                        name={refreshing ? "refresh" : "refresh"}
                        size={24}
                        color="#6C63FF"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={toggleMapType}
                >
                    <Icon
                        name={mapType === 'standard' ? "earth" : "map"}
                        size={24}
                        color="#6C63FF"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={focusOnAllKids}
                >
                    <Icon name="view-grid" size={24} color="#6C63FF" />
                </TouchableOpacity>
            </Animatable.View>

            {/* Selected Kid Card */}
            {selectedKid && (
                <Animatable.View
                    ref={cardRef}
                    animation="fadeInUp"
                    duration={500}
                    style={styles.infoCard}
                >
                    <View style={styles.cardHeader}>
                        <View style={[
                            styles.avatar,
                            styles.cardAvatar,
                            selectedKid.deviceStatus === 'offline' && styles.offlineAvatar,
                            selectedKid.deviceStatus === 'low-battery' && styles.lowBatteryAvatar
                        ]}>
                            <Icon
                                name={
                                    selectedKid.deviceStatus === 'offline' ? 'wifi-off' :
                                        selectedKid.deviceStatus === 'low-battery' ? 'battery-alert' :
                                            'human-child'
                                }
                                size={28}
                                color="white"
                            />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>{selectedKid.fullName}</Text>
                            <Text style={styles.cardSubtitle}>
                                {selectedKid.lastUpdate || formatTimeDifference(selectedKid.createdAt)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardDetails}>
                        <View style={styles.detailItem}>
                            <Icon name="map-marker" size={18} color="#6C63FF" />
                            <Text style={styles.detailText}>
                                {selectedKid.latitude.toFixed(5)}, {selectedKid.longitude.toFixed(5)}
                            </Text>
                        </View>

                        {selectedKid.batteryLevel && (
                            <View style={styles.detailItem}>
                                <Icon
                                    name={
                                        selectedKid.batteryLevel > 70 ? "battery" :
                                            selectedKid.batteryLevel > 30 ? "battery-60" : "battery-20"
                                    }
                                    size={18}
                                    color={
                                        selectedKid.batteryLevel > 70 ? "#4CAF50" :
                                            selectedKid.batteryLevel > 30 ? "#FFC107" : "#F44336"
                                    }
                                />
                                <Text style={styles.detailText}>
                                    Battery: {selectedKid.batteryLevel}%
                                </Text>
                            </View>
                        )}

                        <View style={styles.detailItem}>
                            <Icon
                                name={
                                    selectedKid.deviceStatus === 'offline' ? 'wifi-off' :
                                        selectedKid.deviceStatus === 'low-battery' ? 'alert-circle' :
                                            'check-circle'
                                }
                                size={18}
                                color={
                                    selectedKid.deviceStatus === 'offline' ? '#F44336' :
                                        selectedKid.deviceStatus === 'low-battery' ? '#FFC107' :
                                            '#4CAF50'
                                }
                            />
                            <Text style={styles.detailText}>
                                {selectedKid.deviceStatus === 'offline' ? 'Device offline' :
                                    selectedKid.deviceStatus === 'low-battery' ? 'Low battery' :
                                        'Device online'}
                            </Text>
                        </View>
                    </View>
                </Animatable.View>
            )}

            {/* Empty State */}
            {locations.length === 0 && !loading && (
                <Animatable.View
                    animation="fadeIn"
                    duration={500}
                    style={styles.emptyState}
                >
                    <Icon name="map-marker-off" size={48} color="#9e9e9e" />
                    <Text style={styles.emptyText}>
                        No location data available
                    </Text>
                    <Text style={styles.emptySubtext}>
                        Make sure your children's devices are turned on and connected
                    </Text>

                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={handleRefresh}
                    >
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </Animatable.View>
            )}

            {/* Status Bar */}
            <View style={styles.statusBar}>
                <Text style={styles.statusText}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.statusText}>
                    Updated: {lastUpdated}
                </Text>
                <Text style={styles.statusText}>
                    {locations.length} {locations.length === 1 ? 'child' : 'children'}
                </Text>
            </View>
        </View>
    );
}

// Default region constant
const DEFAULT_REGION = {
    latitude: 41.31,
    longitude: 69.24,
};

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#555',
        fontWeight: '500'
    },
    header: {
        position: 'absolute',
        top: STATUS_BAR_HEIGHT,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        paddingBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500'
    },
    markerContainer: {
        alignItems: 'center',
    },
    selectedMarker: {
        zIndex: 10,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 21,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    offlineAvatar: {
        backgroundColor: '#F44336',
    },
    lowBatteryAvatar: {
        backgroundColor: '#FFC107',
    },
    markerLabel: {
        backgroundColor: 'white',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    markerName: {
        color: '#2D3748',
        fontWeight: '600',
        fontSize: 14,
    },
    controlsContainer: {
        position: 'absolute',
        right: 20,
        bottom: 180,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    controlButton: {
        padding: 10,
        marginVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#718096',
        marginTop: 2,
    },
    cardDetails: {
        borderTopWidth: 1,
        borderTopColor: '#EDF2F7',
        paddingTop: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#4A5568',
    },
    emptyState: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        padding: 40,
        zIndex: 5,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 15,
        color: '#718096',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    refreshButton: {
        marginTop: 24,
        backgroundColor: '#6C63FF',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    refreshButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    statusBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    statusText: {
        color: '#2D3748',
        fontWeight: '500',
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
        fontSize: 12,
    },
});