import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    Modal,
    Pressable,
    Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { createClient } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';

const supabaseUrl = 'https://mybjttehecduzulururb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Ymp0dGVoZWNkdXp1bHVydXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTEyMzEsImV4cCI6MjA2ODEyNzIzMX0.JxyU7I54qAWoQBillFtpm-GaMzAaDc3oPj9iZUQwd08';
const supabase = createClient(supabaseUrl, supabaseKey);

type Store = {
    id: number;
    name: string;
    address: string;
    description?: string;
    contact_number?: string;
    opening_hours?: string;
};

type RootStackParamList = {
    StoreDetails: { storeId: number };
};

const StoreDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'StoreDetails'>>();
    const { storeId } = route.params;
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        address: '',
        description: ''
    });

    useEffect(() => {
        const fetchStoreDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('id', storeId)
                    .single();

                if (error) throw error;
                setStore(data);
                setEditForm({
                    name: data.name,
                    address: data.address,
                    description: data.description || ''
                });

                if (data.image_path) {
                    const { data: imageData } = await supabase
                        .storage
                        .from('store-images')
                        .getPublicUrl(data.image_path);

                    setImageUrl(imageData.publicUrl);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreDetails();
    }, [storeId]);

    const handleUpdateStore = async () => {
        if (!store) return;

        try {
            const { data, error } = await supabase
                .from('stores')
                .update(editForm)
                .eq('id', store.id)
                .select();

            if (error) throw error;

            setStore({ ...store, ...editForm });
            setEditModalVisible(false);
            Alert.alert('Success', 'Store updated successfully');
        } catch (err) {
            Alert.alert('Error', 'Failed to update store');
        }
    };

    const handleDeleteStore = async () => {
        Alert.alert(
            'Delete Store',
            'Are you sure you want to delete this store? All products will also be deleted.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error: storeError } = await supabase
                                .from('stores')
                                .delete()
                                .eq('id', storeId);

                            if (storeError) throw storeError;

                            navigation.goBack();
                            Alert.alert('Success', 'Store deleted successfully');
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete store');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
                <Text style={styles.loadingText}>Loading store details...</Text>
            </View>
        );
    }

    if (!store) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#ff7675" />
                <Text style={styles.errorText}>Store not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with back button */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Store Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Store Image */}
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.storeImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="storefront" size={48} color="#a5b1c2" />
                        <Text style={styles.placeholderText}>No Image Available</Text>
                    </View>
                )}

                {/* Store Info */}
                <View style={styles.contentContainer}>
                    <Text style={styles.storeName}>{store.name}</Text>

                    {/* Rating and Category Placeholder */}
                    <View style={styles.metaContainer}>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#fdcb6e" />
                            <Text style={styles.ratingText}>4.8</Text>
                            <Text style={styles.ratingCount}>(24 reviews)</Text>
                        </View>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>Electronics</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Address Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="location-sharp" size={20} color="#6c5ce7" />
                            <Text style={styles.sectionTitle}>Address</Text>
                        </View>
                        <Text style={styles.sectionContent}>{store.address}</Text>
                    </View>

                    {/* Description Section */}
                    {store.description && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="information-circle" size={20} color="#6c5ce7" />
                                <Text style={styles.sectionTitle}>About</Text>
                            </View>
                            <Text style={styles.sectionContent}>{store.description}</Text>
                        </View>
                    )}

                    {/* Contact Section */}
                    {store.contact_number && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="call" size={20} color="#6c5ce7" />
                                <Text style={styles.sectionTitle}>Contact</Text>
                            </View>
                            <Text style={styles.sectionContent}>{store.contact_number}</Text>
                        </View>
                    )}

                    {/* Opening Hours Section */}
                    {store.opening_hours && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="time" size={20} color="#6c5ce7" />
                                <Text style={styles.sectionTitle}>Opening Hours</Text>
                            </View>
                            <Text style={styles.sectionContent}>{store.opening_hours}</Text>
                        </View>
                    )}

                    {/* Edit/Delete Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.editButton]}
                            onPress={() => setEditModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Edit Store</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => setDeleteModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="trash-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Delete Store</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Edit Store Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Store</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#636e72" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Store Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter store name"
                                    value={editForm.name}
                                    onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter store address"
                                    value={editForm.address}
                                    onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Enter store description"
                                    value={editForm.description}
                                    onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleUpdateStore}
                                disabled={!editForm.name || !editForm.address}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Store Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { width: '90%' }]}>
                        <View style={styles.deleteModalContent}>
                            <View style={styles.deleteIconContainer}>
                                <Ionicons name="warning" size={48} color="#ff7675" />
                            </View>
                            <Text style={styles.deleteModalTitle}>Delete Store</Text>
                            <Text style={styles.deleteModalText}>
                                Are you sure you want to delete this store? This action cannot be undone.
                            </Text>
                        </View>

                        <View style={styles.modalFooter}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.deleteModalButton]}
                                onPress={handleDeleteStore}
                            >
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f6fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#636e72',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f6fa',
        padding: 20,
    },
    errorText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2d3436',
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: '#6c5ce7',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#6c5ce7',
        elevation: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    storeImage: {
        width: '100%',
        height: 220,
    },
    imagePlaceholder: {
        width: '100%',
        height: 220,
        backgroundColor: '#dfe6e9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: '#636e72',
        fontSize: 14,
    },
    contentContainer: {
        padding: 20,
        backgroundColor: '#fff',
        marginTop: -20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 2,
    },
    storeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3436',
        marginBottom: 8,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '600',
        color: '#2d3436',
    },
    ratingCount: {
        marginLeft: 4,
        fontSize: 12,
        color: '#636e72',
    },
    categoryBadge: {
        backgroundColor: '#dfe6e9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        color: '#2d3436',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#dfe6e9',
        marginVertical: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3436',
        marginLeft: 8,
    },
    sectionContent: {
        fontSize: 15,
        color: '#636e72',
        lineHeight: 22,
        marginLeft: 28,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        flex: 1,
    },
    editButton: {
        backgroundColor: '#00b894',
        marginRight: 12,
    },
    deleteButton: {
        backgroundColor: '#ff7675',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#dfe6e9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    modalContent: {
        padding: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#dfe6e9',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#636e72',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f6fa',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        color: '#2d3436',
        borderWidth: 1,
        borderColor: '#dfe6e9',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalButton: {
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    cancelButton: {
        backgroundColor: '#f5f6fa',
    },
    cancelButtonText: {
        color: '#636e72',
        fontWeight: '600',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#6c5ce7',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    deleteModalContent: {
        padding: 24,
        alignItems: 'center',
    },
    deleteIconContainer: {
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2d3436',
        marginBottom: 8,
    },
    deleteModalText: {
        fontSize: 16,
        color: '#636e72',
        textAlign: 'center',
        lineHeight: 24,
    },
    deleteModalButton: {
        backgroundColor: '#ff7675',
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default StoreDetailsScreen;