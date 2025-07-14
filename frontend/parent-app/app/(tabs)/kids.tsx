import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, Modal, Pressable, Alert, TextInput,
    ActivityIndicator, RefreshControl
} from 'react-native';
import api from '@/services/api';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Kid = {
    id: string;
    fullName: string;
    setupToken: string;
};

export default function KidsScreen() {
    const [kids, setKids] = useState<Kid[]>([]);
    const [qrVisible, setQrVisible] = useState(false);
    const [selectedToken, setSelectedToken] = useState<string | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [creating, setCreating] = useState(false);

    const fetchKids = useCallback(async () => {
        try {
            const res = await api.get('/users/me/kids');
            setKids(res.data);
        } catch (err) {
            Alert.alert('Xatolik', 'Farzandlarni yuklab bo‘lmadi');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchKids();
    }, [fetchKids]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchKids();
    }, [fetchKids]);

    const showQr = (token: string) => {
        setSelectedToken(token);
        setQrVisible(true);
    };

    const createKid = async () => {
        if (!newName.trim()) {
            return Alert.alert('Ism kiritilmagan', 'Iltimos, bolangizning ismini kiriting');
        }

        try {
            setCreating(true);
            await api.post('/users', { fullName: newName });
            setNewName('');
            setAddModalVisible(false);
            fetchKids();
            Alert.alert('Muvaffaqiyatli', 'Farzand muvaffaqiyatli qo‘shildi');
        } catch (err) {
            Alert.alert('Xatolik', 'Farzand yaratishda muammo yuz berdi');
        } finally {
            setCreating(false);
        }
    };

    const renderKidItem = ({ item }: { item: Kid }) => (
        <View style={styles.kidCard}>
            <View style={styles.kidInfo}>
                <View style={styles.avatar}>
                    <Icon name="child-care" size={24} color="#5E60CE" />
                </View>
                <Text style={styles.kidName} numberOfLines={1}>{item.fullName}</Text>
            </View>
            <TouchableOpacity
                style={styles.setupBtn}
                onPress={() => showQr(item.setupToken)}
            >
                <Icon name="qr-code" size={18} color="white" />
                <Text style={styles.setupText}>Sozlash</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#5E60CE" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Farzandlaringiz</Text>
                <Text style={styles.subtitle}>Bolalaringizni boshqarish</Text>
            </View>

            <FlatList
                data={kids}
                keyExtractor={(item) => item.id}
                renderItem={renderKidItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="child-friendly" size={48} color="#e0e0e0" />
                        <Text style={styles.emptyText}>Hozircha farzandlar yo‘q</Text>
                        <Text style={styles.emptySubtext}>Quyidagi ➕ tugmasini bosib yangisini qo'shing</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#5E60CE']}
                        tintColor="#5E60CE"
                    />
                }
            />

            {/* Add Child FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setAddModalVisible(true)}
            >
                <Icon name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* QR Code Modal */}
            <Modal
                visible={qrVisible}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>QR kodni skanerlash</Text>
                        <Text style={styles.modalDescription}>
                            Bolalar ilovasida QR kod skanerini ochib, quyidagi kodni skanering
                        </Text>

                        <View style={styles.qrContainer}>
                            {selectedToken && <QRCode
                                value={selectedToken}
                                size={220}
                                backgroundColor="white"
                                color="black"
                            />}
                        </View>

                        <View style={styles.modalActions}>
                            <Pressable
                                style={[styles.modalButton, styles.primaryButton]}
                                onPress={() => setQrVisible(false)}
                            >
                                <Text style={styles.buttonText}>Tushunarli</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Child Modal */}
            <Modal
                visible={addModalVisible}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Yangi farzand qo'shish</Text>

                        <TextInput
                            placeholder="To'liq ismi"
                            placeholderTextColor="#999"
                            value={newName}
                            onChangeText={setNewName}
                            style={styles.input}
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            <Pressable
                                style={[styles.modalButton, styles.secondaryButton]}
                                onPress={() => setAddModalVisible(false)}
                                disabled={creating}
                            >
                                <Text style={[styles.buttonText, styles.secondaryText]}>Bekor qilish</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.primaryButton]}
                                onPress={createKid}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Qo'shish</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    header: {
        padding: 24,
        paddingBottom: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea'
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333'
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4
    },
    listContent: {
        padding: 16,
        paddingBottom: 80
    },
    kidCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1
    },
    kidInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    kidName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1
    },
    setupBtn: {
        backgroundColor: '#5E60CE',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    setupText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#5E60CE',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center'
    },
    modalDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20
    },
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 24
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4
    },
    primaryButton: {
        backgroundColor: '#5E60CE'
    },
    secondaryButton: {
        backgroundColor: '#f0f0f0'
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16
    },
    secondaryText: {
        color: '#666'
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        fontSize: 16,
        backgroundColor: '#f8f9fa'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        textAlign: 'center'
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center'
    }
});