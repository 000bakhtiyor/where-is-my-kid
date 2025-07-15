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
    Platform,
    RefreshControl
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { useAuthGuard } from '@/hooks/useAuth';

type User = {
    id: string;
    fullName: string;
    role: string;
    profileImage?: string;
};

type Kid = {
    id: string;
    fullName: string;
    status: 'safe' | 'warning' | 'danger';
    lastSeen: string;
    location?: string;
    batteryLevel?: number;
};

type AlertItem = {
    id: string;
    kidName: string;
    message: string;
    timestamp: string;
    type: 'location' | 'battery' | 'zone';
};

export default function DashboardScreen() {
    useAuthGuard();
    const [user, setUser] = useState<User | null>(null);
    const [kids, setKids] = useState<Kid[]>([]);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const navigation = useNavigation();

    const fetchData = async () => {
        try {
            const storedUser = await SecureStore.getItemAsync('user');
            const token = await SecureStore.getItemAsync('token');

            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser({
                    ...userData,
                    profileImage: userData.profileImage || 'https://randomuser.me/api/portraits/men/1.jpg'
                });
            }

            const [kidRes, alertRes] = await Promise.all([
                api.get('/users/me/kids', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                // Simulated alerts since your API call is commented out
                Promise.resolve({
                    data: [
                        { id: '1', kidName: 'Karimova Zuhra', message: 'Xavfsiz zonadan chiqdi', timestamp: '10:45', type: 'zone' },
                        { id: '2', kidName: 'Aliyev Vali', message: 'Batareya quvvati past', timestamp: '9:30', type: 'battery' }
                    ]
                })
            ]);

            const fetchedKids: Kid[] = kidRes.data.map((k: any) => ({
                id: k.id,
                fullName: k.fullName,
                status: k.status || 'safe',
                lastSeen: 'Yaqinda',
                location: k?.lastKnownLocation || 'nomaʼlum joy',
                batteryLevel: k.batteryLevel || Math.floor(Math.random() * 100)
            }));

            const fetchedAlerts: AlertItem[] = alertRes.data.map((a: any) => ({
                id: a.id,
                kidName: a.kidName,
                message: a.message,
                timestamp: a.timestamp,
                type: a.type
            }));

            setKids(fetchedKids);
            setAlerts(fetchedAlerts);
        } catch (error) {
            console.error('Error fetching data', error);
            Alert.alert('Xatolik', 'Ma`lumotlarni yangilashda xatolik yuz berdi.');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };

        loadData();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        Alert.alert(
            "Chiqish",
            "Rostan ham hisobdan chiqmoqchimisiz?",
            [
                { text: "Bekor qilish", style: "cancel" },
                {
                    text: "Chiqish",
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
    };

    const navigateToAlerts = () => {
        // router.push('/alerts');
    };

    const navigateToSafeZones = () => {
        router.push('/safe-zones');
    };

    const navigateToAddKid = () => {
        router.push('/kids');
    };

    const navigateToMap = () => {
        router.push('/map');
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        style={[styles.headerButton, { marginRight: 15 }]}
                    >
                        <Ionicons name="refresh" size={24} color="#4A90E2" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
                        <Ionicons name="log-out-outline" size={24} color="#4A90E2" />
                    </TouchableOpacity>
                </View>
            ),
            headerLeft: () => (
                <TouchableOpacity onPress={navigateToAlerts} style={styles.headerButton}>
                    <View style={styles.notificationBadge}>
                        <Text style={styles.badgeText}>{alerts.length}</Text>
                    </View>
                    <Ionicons name="notifications-outline" size={24} color="#4A90E2" />
                </TouchableOpacity>
            ),
            headerTitle: "Boshqaruv Paneli",
            headerTitleStyle: {
                fontWeight: '600',
                color: '#333'
            }
        });
    }, [navigation, alerts]);

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
                <View style={styles.batteryIndicator}>
                    <MaterialCommunityIcons
                        name={
                            item.batteryLevel && item.batteryLevel > 70 ? "battery" :
                                item.batteryLevel && item.batteryLevel > 30 ? "battery-60" : "battery-20"
                        }
                        size={20}
                        color={
                            item.batteryLevel && item.batteryLevel > 70 ? "#4CAF50" :
                                item.batteryLevel && item.batteryLevel > 30 ? "#FFC107" : "#F44336"
                        }
                    />
                    <Text style={styles.batteryText}>{item.batteryLevel}%</Text>
                </View>
            </View>

            <View style={styles.kidInfo}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.kidDetail}>{item.location || 'Nomaʼlum joy'}</Text>
            </View>

            <View style={styles.kidInfo}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.kidDetail}>{item.lastSeen}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderAlertItem = ({ item }: { item: AlertItem }) => (
        <TouchableOpacity style={styles.alertItem} onPress={navigateToAlerts}>
            <View style={[
                styles.alertIcon,
                item.type === 'zone' ? { backgroundColor: '#FFECB3' } :
                    item.type === 'battery' ? { backgroundColor: '#FFCDD2' } :
                        { backgroundColor: '#C8E6C9' }
            ]}>
                <Ionicons
                    name={
                        item.type === 'zone' ? 'location-outline' :
                            item.type === 'battery' ? 'battery-charging-outline' : 'warning'
                    }
                    size={20}
                    color={
                        item.type === 'zone' ? '#FFA000' :
                            item.type === 'battery' ? '#D32F2F' : '#388E3C'
                    }
                />
            </View>
            <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{item.kidName}</Text>
                <Text style={styles.alertMessage}>{item.message}</Text>
                <Text style={styles.alertTime}>{item.timestamp}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer} >
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Yuklanmoqda...</Text>
            </View>
        );
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('uz-UZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={["#4A90E2"]}
                    tintColor="#4A90E2"
                />
            }
        >
            {/* Header Section */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>👋 Salom {user?.fullName || 'ota-ona'}!</Text>
                    <Text style={styles.subtitle}>{formattedDate}</Text>
                </View>
                <Image
                    source={{ uri: user?.profileImage }}
                    style={styles.profileImage}
                />
            </View>

            {/* Status Summary */}
            <View style={[styles.summaryContainer, styles.cardShadow]}>
                <View style={styles.summaryItem}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="people-outline" size={24} color="#4A90E2" />
                    </View>
                    <Text style={styles.summaryValue}>{kids.length}</Text>
                    <Text style={styles.summaryLabel}>Bolalar</Text>
                </View>

                <View style={styles.summaryItem}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#E8F5E9' }]}>
                        <MaterialIcons name="safety-divider" size={24} color="#4CAF50" />
                    </View>
                    <Text style={styles.summaryValue}>2</Text>
                    <Text style={styles.summaryLabel}>Xavfsiz Zonalar</Text>
                </View>

                <View style={styles.summaryItem}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#FFEBEE' }]}>
                        <Ionicons name="notifications-outline" size={24} color="#F44336" />
                    </View>
                    <Text style={[styles.summaryValue, styles.alertValue]}>{alerts.length}</Text>
                    <Text style={styles.summaryLabel}>Ogohlantirish</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Tezkor Harakatlar</Text>
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.cardShadow]}
                    onPress={navigateToAddKid}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="person-add-outline" size={24} color="#4A90E2" />
                    </View>
                    <Text style={styles.actionText}>Bola qo'shish</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.cardShadow]}
                    onPress={navigateToSafeZones}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                        <MaterialIcons name="safety-divider" size={24} color="#4CAF50" />
                    </View>
                    <Text style={styles.actionText}>Xavfsiz Zona</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.cardShadow]}
                    onPress={navigateToAlerts}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]}>
                        <Ionicons name="notifications-outline" size={24} color="#F44336" />
                    </View>
                    <Text style={styles.actionText}>Ogohlantirish</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.cardShadow]}
                    onPress={handleRefresh}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#E1F5FE' }]}>
                        <Ionicons name="refresh" size={24} color="#039BE5" />
                    </View>
                    <Text style={styles.actionText}>Yangilash</Text>
                </TouchableOpacity>
            </View>

            {/* Alerts Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Oxirgi Ogohlantirishlar</Text>
                <TouchableOpacity onPress={navigateToAlerts}>
                    <Text style={styles.seeAll}>Hammasi</Text>
                </TouchableOpacity>
            </View>

            {alerts.length > 0 ? (
                <FlatList
                    data={alerts.slice(0, 2)}
                    renderItem={renderAlertItem}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.alertsContainer}
                />
            ) : (
                <View style={styles.emptySection}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
                    <Text style={styles.emptyText}>Ogohlantirishlar yo'q</Text>
                </View>
            )}

            {/* Kids Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bolalarim</Text>
                <TouchableOpacity onPress={navigateToAddKid}>
                    <Ionicons name="add-circle" size={28} color="#4A90E2" />
                </TouchableOpacity>
            </View>

            {kids.length > 0 ? (
                <FlatList
                    data={kids}
                    renderItem={renderKidItem}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.kidsContainer}
                />
            ) : (
                <View style={styles.emptySection}>
                    <Ionicons name="person-outline" size={48} color="#4A90E2" />
                    <Text style={styles.emptyText}>Bolalar qo'shilmagan</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={navigateToAddKid}
                    >
                        <Text style={styles.addButtonText}>Bola qo'shish</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        backgroundColor: '#f8fafc'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc'
    },
    loadingText: {
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
        color: '#1e293b'
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 4
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#4A90E2'
    },
    alertValue: {
        color: '#F44336'
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748b',
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
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
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
        color: '#334155',
        textAlign: 'center'
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b'
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
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    alertIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    alertContent: {
        flex: 1
    },
    alertTitle: {
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 4,
        color: '#1e293b'
    },
    alertMessage: {
        color: '#64748b',
        marginBottom: 4
    },
    alertTime: {
        color: '#94a3b8',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
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
        color: '#1e293b',
        flex: 1
    },
    batteryIndicator: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    batteryText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#64748b'
    },
    kidInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    kidDetail: {
        marginLeft: 8,
        color: '#64748b'
    },
    headerButton: {
        padding: 8
    },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#F44336',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    emptySection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center'
    },
    addButton: {
        marginTop: 20,
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16
    }
});