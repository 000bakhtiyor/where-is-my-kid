import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Image,
    ActivityIndicator,
    FlatList,
    Platform
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '@/services/api';

type User = {
    id: string;
    fullName: string;
    role: string;
};

type Kid = {
    id: string;
    fullName: string;
    status: 'safe' | 'warning' | 'danger';
    lastSeen: string;
    location?: string;
};

type AlertItem = {
    id: string;
    kidName: string;
    message: string;
    timestamp: string;
};

type Location = {
    kidId: string;
    kidName: string;
    latitude: number;
    longitude: number;
    timestamp: string;
};

export default function DashboardScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [kids, setKids] = useState<Kid[]>([]);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const navigation = useNavigation();

    
    // useEffect(() => {
    //     const loadData = async () => {
    //         const storedUser = await SecureStore.getItemAsync('user');
    //         if (storedUser) {
    //             setUser(JSON.parse(storedUser));
    //         }
            
    //         // Simulating API calls
    //         setTimeout(() => {
    //             setKids([
    //                 { id: '1', fullName: 'Aliyev Vali', status: 'safe', lastSeen: '5 mins ago', location: 'Home' },
    //                 { id: '2', fullName: 'Karimova Zuhra', status: 'warning', lastSeen: '15 mins ago', location: 'School' }
    //             ]);
                
    //             setAlerts([
    //                 { id: '1', kidName: 'Karimova Zuhra', message: 'Left safe zone', timestamp: '10:45 AM' },
    //                 { id: '2', kidName: 'Aliyev Vali', message: 'Battery low', timestamp: '9:30 AM' }
    //             ]);
                
    //             setLocations([
    //                 { kidId: '1', kidName: 'Aliyev Vali', latitude: 41.311081, longitude: 69.279716, timestamp: '2023-05-15T10:30:00Z' },
    //                 { kidId: '2', kidName: 'Karimova Zuhra', latitude: 41.335, longitude: 69.284, timestamp: '2023-05-15T10:25:00Z' }
    //             ]);
                
    //             setLoading(false);
    //         }, 1500);
    //     };
        
    //     loadData();
    // }, []);


    useEffect(() => {
        const loadData = async () => {
            try {
                const storedUser = await SecureStore.getItemAsync('user');
                const token = await SecureStore.getItemAsync('token');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                const [kidRes] = await Promise.all([
                    api.get('/users/me/kids', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    // api.get('/alert/my-kids', {
                    //     headers: { Authorization: `Bearer ${token}` }
                    // })
                ]);

                const fetchedKids: Kid[] = kidRes.data.map((k: any) => ({
                    id: k.id,
                    fullName: k.fullName,
                    status: k.status || 'safe',
                    lastSeen: 'Yaqinda',
                    location: k?.lastKnownLocation || 'nomaʼlum joy'
                }));

                // const fetchedAlerts: AlertItem[] = alertRes.data.map((a: any) => ({
                //     id: a.id,
                //     kidName: a.kidName,
                //     message: a.message,
                //     timestamp: new Date(a.createdAt).toLocaleTimeString()
                // }));

                setKids(fetchedKids);
                // setAlerts(fetchedAlerts);
            } catch (error) {
                console.error('Error fetching data', error);
                Alert.alert('Xatolik', 'Dashboard ma`lumotlarini olishda xatolik yuz berdi.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);


    const handleLogout = async () => {
        Alert.alert(
            "Logout Confirmation",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Logout", 
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('token');
                        await SecureStore.deleteItemAsync('user');
                        router.replace('/login');
                    } 
                }
            ]
        );
    };

    const navigateToKidDetail = (kidId: string) => {
        // router.push(`/kid-detail/${kidId}`);
        router.push('/(tabs)/dashboard')
    };

    const navigateToAlerts = () => {
        // router.push('/alerts');
        router.push('/(tabs)/dashboard')
    };

    const navigateToSafeZones = () => {
        // router.push('/safe-zones');
        router.push('/(tabs)/dashboard')
    };

    const navigateToAddKid = () => {
        // router.push('/add-kid');
        router.push('/(tabs)/dashboard')
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
                    <Ionicons name="log-out-outline" size={24} color="#333" />
                </TouchableOpacity>
            ),
            headerLeft: () => (
                <TouchableOpacity onPress={() => {}} style={{ marginLeft: 15 }}>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                </TouchableOpacity>
            )
        });
    }, [navigation]);

    const renderKidItem = ({ item }: { item: Kid }) => (
        <TouchableOpacity 
            style={[styles.kidCard, styles.cardShadow]} 
            onPress={() => navigateToKidDetail(item.id)}
        >
            <View style={styles.kidHeader}>
                <View style={[
                    styles.statusIndicator, 
                    item.status === 'safe' ? styles.safeStatus : 
                    item.status === 'warning' ? styles.warningStatus : 
                    styles.dangerStatus
                ]} />
                <Text style={styles.kidName}>{item.fullName}</Text>
            </View>
            
            <View style={styles.kidInfo}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.kidDetail}>{item.location || 'Unknown location'}</Text>
            </View>
            
            <View style={styles.kidInfo}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.kidDetail}>{item.lastSeen}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderAlertItem = ({ item }: { item: AlertItem }) => (
        <View style={styles.alertItem}>
            <View style={styles.alertIcon}>
                <Ionicons name="warning" size={20} color="#E74C3C" />
            </View>
            <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{item.kidName}</Text>
                <Text style={styles.alertMessage}>{item.message}</Text>
                <Text style={styles.alertTime}>{item.timestamp}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer} >
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text>Loading your dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>👋 Salom {user?.fullName || 'ota'}!</Text>
                    <Text style={styles.subtitle}>Bugun, 15 May, Juma</Text>
                </View>
                <Image 
                    source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }} 
                    style={styles.profileImage} 
                />
            </View>

            {/* Status Summary */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{kids.length}</Text>
                    <Text style={styles.summaryLabel}>Bolalar</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>2</Text>
                    <Text style={styles.summaryLabel}>Xavfsiz Zonalar</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, styles.alertValue]}>1</Text>
                    <Text style={styles.summaryLabel}>Ogohlantirish</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={navigateToAddKid}>
                    <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="person-add-outline" size={24} color="#4A90E2" />
                    </View>
                    <Text style={styles.actionText}>Bola qo'shish</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={navigateToSafeZones}>
                    <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                        <MaterialIcons name="safety-divider" size={24} color="#4CAF50" />
                    </View>
                    <Text style={styles.actionText}>Xavfsiz Zona</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={navigateToAlerts}>
                    <View style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]}>
                        <Ionicons name="notifications-outline" size={24} color="#F44336" />
                    </View>
                    <Text style={styles.actionText}>Ogohlantirish</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
                    <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                        <FontAwesome5 name="map-marker-alt" size={20} color="#9C27B0" />
                    </View>
                    <Text style={styles.actionText}>Lokatsiya</Text>
                </TouchableOpacity>
            </View>

            {/* Alerts Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Oxirgi Ogohlantirishlar</Text>
                <TouchableOpacity onPress={navigateToAlerts}>
                    <Text style={styles.seeAll}>Hammasini ko'rish</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList
                data={alerts.slice(0, 2)}
                renderItem={renderAlertItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.alertsContainer}
            />

            {/* Kids Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bolalarim</Text>
                <TouchableOpacity onPress={navigateToAddKid}>
                    <Ionicons name="add-circle" size={24} color="#4A90E2" />
                </TouchableOpacity>
            </View>
            
            <FlatList
                data={kids}
                renderItem={renderKidItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.kidsContainer}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
        backgroundColor: '#f0f4f8'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f8'
    },
    loadindText: {
        marginTop: 20,
        color: '#555',
        fontSize: 16
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    profileImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: '#4A90E2'
    },
    welcome: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#333' 
    },
    subtitle: { 
        fontSize: 16, 
        color: '#666', 
        marginTop: 4 
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
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
    summaryItem: {
        alignItems: 'center'
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#4A90E2'
    },
    alertValue: {
        color: '#E74C3C'
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    actionButton: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center'
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    seeAll: {
        color: '#4A90E2',
        fontWeight: '500'
    },
    alertsContainer: {
        marginBottom: 20
    },
    alertItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    alertIcon: {
        marginRight: 16
    },
    alertContent: {
        flex: 1
    },
    alertTitle: {
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 4
    },
    alertMessage: {
        color: '#666',
        marginBottom: 4
    },
    alertTime: {
        color: '#999',
        fontSize: 12
    },
    kidsContainer: {
        marginBottom: 20
    },
    kidCard: {
        backgroundColor: '#fff',
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
    kidHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10
    },
    safeStatus: {
        backgroundColor: '#4CAF50'
    },
    warningStatus: {
        backgroundColor: '#FFC107'
    },
    dangerStatus: {
        backgroundColor: '#F44336'
    },
    kidName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333'
    },
    kidInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    kidDetail: {
        marginLeft: 8,
        color: '#666'
    }
});