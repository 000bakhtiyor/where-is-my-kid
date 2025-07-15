import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    FlatList,
    Platform,
    TextInput,
    Modal
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import api from '@/services/api';

type SafeZone = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
};

// Default region constant
const DEFAULT_REGION: Region = {
    latitude: 41.31,
    longitude: 69.24,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export default function SafeZonesScreen() {
    const [zones, setZones] = useState<SafeZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        latitude: '',
        longitude: '',
        radius: '200'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const router = useRouter();

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync('token');
            const response = await api.get('/zones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setZones(response.data);
        } catch (error) {
            console.error('Error fetching safe zones', error);
            Alert.alert('Xatolik', 'Xavfsiz zonalarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Nom kiritilishi shart';
        if (!formData.latitude.trim()) newErrors.latitude = 'Kenglik kiritilishi shart';
        if (!formData.longitude.trim()) newErrors.longitude = 'Uzunlik kiritilishi shart';
        if (!formData.radius.trim()) newErrors.radius = 'Radius kiritilishi shart';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateZone = async () => {
        if (!validateForm()) return;

        try {
            const token = await SecureStore.getItemAsync('token');
            await api.post('/zones', {
                name: formData.name,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                radius: parseInt(formData.radius, 10)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Muvaffaqiyatli', 'Xavfsiz zona muvaffaqiyatli qoʻshildi');
            setShowForm(false);
            setFormData({ name: '', latitude: '', longitude: '', radius: '200' });
            setSelectedLocation(null);
            fetchZones();
        } catch (error) {
            console.error('Error creating safe zone', error);
            Alert.alert('Xatolik', 'Xavfsiz zona qoʻshishda xatolik yuz berdi');
        }
    };

    const handleDeleteZone = (id: string) => {
        Alert.alert(
            "Zonani o'chirish",
            "Haqiqatan ham bu xavfsiz zonani o'chirmoqchimisiz?",
            [
                { text: "Bekor qilish", style: "cancel" },
                {
                    text: "O'chirish",
                    onPress: async () => {
                        try {
                            const token = await SecureStore.getItemAsync('token');
                            await api.delete(`/zones/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            fetchZones();
                        } catch (error) {
                            console.error('Error deleting safe zone', error);
                            Alert.alert('Xatolik', "Zonani o'chirishda xatolik yuz berdi");
                        }
                    }
                }
            ]
        );
    };

    const handleMapPress = (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setSelectedLocation({ latitude, longitude });
        setFormData({
            ...formData,
            latitude: latitude.toString(),
            longitude: longitude.toString()
        });
    };

    const openMapPicker = () => {
        if (formData.latitude && formData.longitude) {
            setMapRegion({
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        }
        setShowMapPicker(true);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text>Zonalar yuklanmoqda...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
            <View style={styles.header}>
                <Text style={styles.title}>Xavfsiz Zonalar</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowForm(!showForm)}
                >
                    <Ionicons
                        name={showForm ? "close" : "add"}
                        size={24}
                        color="#FFF"
                    />
                </TouchableOpacity>
            </View>

            {showForm && (
                <View style={[styles.formContainer, styles.cardShadow]}>
                    <Text style={styles.formTitle}>Yangi Xavfsiz Zona</Text>

                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        placeholder="Zona nomi (Masalan: Uy, Maktab)"
                        value={formData.name}
                        onChangeText={text => setFormData({ ...formData, name: text })}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                    <View style={styles.coordinateContainer}>
                        <View style={styles.coordinateInput}>
                            <TextInput
                                style={[styles.input, errors.latitude && styles.inputError]}
                                placeholder="Kenglik"
                                keyboardType="numbers-and-punctuation"
                                value={formData.latitude}
                                onChangeText={text => setFormData({ ...formData, latitude: text })}
                                editable={false}
                            />
                            {errors.latitude && <Text style={styles.errorText}>{errors.latitude}</Text>}
                        </View>

                        <View style={styles.coordinateInput}>
                            <TextInput
                                style={[styles.input, errors.longitude && styles.inputError]}
                                placeholder="Uzunlik"
                                keyboardType="numbers-and-punctuation"
                                value={formData.longitude}
                                onChangeText={text => setFormData({ ...formData, longitude: text })}
                                editable={false}
                            />
                            {errors.longitude && <Text style={styles.errorText}>{errors.longitude}</Text>}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.mapPickerButton}
                        onPress={openMapPicker}
                    >
                        <Ionicons name="map" size={20} color="#4A90E2" />
                        <Text style={styles.mapPickerText}>Xaritadan joyni tanlang</Text>
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.input, errors.radius && styles.inputError]}
                        placeholder="Radius (metrda)"
                        keyboardType="numeric"
                        value={formData.radius}
                        onChangeText={text => setFormData({ ...formData, radius: text })}
                    />
                    {errors.radius && <Text style={styles.errorText}>{errors.radius}</Text>}

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleCreateZone}
                    >
                        <Text style={styles.submitButtonText}>Zonani Saqlash</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Text style={styles.sectionTitle}>
                Mavjud Zonalar ({zones.length})
            </Text>

            {zones.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="safety-divider" size={48} color="#DDD" />
                    <Text style={styles.emptyText}>Hech qanday xavfsiz zona topilmadi</Text>
                </View>
            ) : (
                <FlatList
                    data={zones}
                    scrollEnabled={false}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={[styles.zoneCard, styles.cardShadow]}>
                            <View style={styles.zoneHeader}>
                                <MaterialIcons name="safety-divider" size={24} color="#4A90E2" />
                                <Text style={styles.zoneName}>{item.name}</Text>
                            </View>

                            <View style={styles.zoneDetails}>
                                <View style={styles.detailItem}>
                                    <Ionicons name="location-outline" size={16} color="#666" />
                                    <Text style={styles.detailText}>
                                        {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                                    </Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Ionicons name="resize-outline" size={16} color="#666" />
                                    <Text style={styles.detailText}>
                                        Radius: {item.radius} metr
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteZone(item.id)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={styles.zonesContainer}
                />
            )}

            {/* Map Picker Modal */}
            <Modal
                visible={showMapPicker}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowMapPicker(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowMapPicker(false)}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Xaritadan joyni tanlang</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <MapView
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        region={mapRegion}
                        onPress={handleMapPress}
                    >
                        {selectedLocation && (
                            <Marker
                                coordinate={selectedLocation}
                                title="Tanlangan joy"
                            />
                        )}
                    </MapView>

                    <View style={styles.mapFooter}>
                        {selectedLocation ? (
                            <>
                                <Text style={styles.locationText}>
                                    Kenglik: {selectedLocation.latitude.toFixed(6)}
                                </Text>
                                <Text style={styles.locationText}>
                                    Uzunlik: {selectedLocation.longitude.toFixed(6)}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.instructionText}>
                                Xaritani bosing joyni tanlash uchun
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={() => setShowMapPicker(false)}
                        >
                            <Text style={styles.confirmButtonText}>Tasdiqlash</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        backgroundColor: '#f0f4f8'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f8'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333'
    },
    addButton: {
        backgroundColor: '#4A90E2',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    formContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333'
    },
    input: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E9ECEF',
        borderRadius: 10,
        padding: 14,
        marginBottom: 8,
        fontSize: 16
    },
    inputError: {
        borderColor: '#E74C3C'
    },
    errorText: {
        color: '#E74C3C',
        marginBottom: 12,
        fontSize: 14
    },
    coordinateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    coordinateInput: {
        width: '48%'
    },
    mapPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        justifyContent: 'center'
    },
    mapPickerText: {
        marginLeft: 8,
        color: '#4A90E2',
        fontWeight: '500'
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        marginTop: 8
    },
    submitButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#FFF',
        borderRadius: 16
    },
    emptyText: {
        marginTop: 16,
        color: '#999',
        fontSize: 16
    },
    zonesContainer: {
        paddingBottom: 20
    },
    zoneCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    cardShadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    zoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    zoneName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginLeft: 12
    },
    zoneDetails: {
        marginLeft: 36
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    detailText: {
        marginLeft: 8,
        color: '#666'
    },
    deleteButton: {
        position: 'absolute',
        top: 20,
        right: 20
    },
    // Map Picker Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        backgroundColor: '#FFF'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    map: {
        flex: 1
    },
    mapFooter: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#EEE'
    },
    locationText: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333'
    },
    instructionText: {
        fontSize: 16,
        marginBottom: 16,
        color: '#666',
        textAlign: 'center'
    },
    confirmButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center'
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16
    }
});