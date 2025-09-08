import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';

const supabaseUrl = 'https://mybjttehecduzulururb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Ymp0dGVoZWNkdXp1bHVydXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTEyMzEsImV4cCI6MjA2ODEyNzIzMX0.JxyU7I54qAWoQBillFtpm-GaMzAaDc3oPj9iZUQwd08';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Store {
    id: string;
    name: string;
    address: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export default function AllStoresScreen() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        fetchStores();
    }, [filter]);

    const fetchStores = async () => {
        setRefreshing(true);
        let query = supabase
            .from('stores')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.log(error);
            alert('Error fetching stores');
        } else {
            setStores(data || []);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#4CAF50';
            case 'rejected': return '#F44336';
            case 'pending': return '#FFC107';
            default: return '#9E9E9E';
        }
    };

    const handleStatusChange = async (storeId: string, newStatus: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('stores')
            .update({ status: newStatus })
            .eq('id', storeId);

        if (!error) {
            setStores(stores.map(store =>
                store.id === storeId ? { ...store, status: newStatus } : store
            ));
            alert(`Store ${newStatus} successfully!`);
        } else {
            alert(`Failed to ${newStatus} the store`);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>All Stores</Text>
                <Ionicons name="business" size={24} color="#fff" />
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={styles.filterText}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'pending' && styles.activeFilter]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={styles.filterText}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'approved' && styles.activeFilter]}
                    onPress={() => setFilter('approved')}
                >
                    <Text style={styles.filterText}>Approved</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'rejected' && styles.activeFilter]}
                    onPress={() => setFilter('rejected')}
                >
                    <Text style={styles.filterText}>Rejected</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={styles.loadingText}>Loading stores...</Text>
                </View>
            ) : stores.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="file-tray-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No stores found</Text>
                    <Text style={styles.emptySubtext}>
                        {filter === 'all'
                            ? 'No stores in the system'
                            : `No ${filter} stores`}
                    </Text>
                    <TouchableOpacity onPress={fetchStores} style={styles.refreshButton}>
                        <Text style={styles.refreshText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={stores}
                    keyExtractor={(item) => item.id}
                    refreshing={refreshing}
                    onRefresh={fetchStores}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.storeCard}>
                            <View style={styles.storeInfo}>
                                <Text style={styles.storeName}>{item.name}</Text>
                                <View style={styles.addressContainer}>
                                    <Ionicons name="location-sharp" size={16} color="#666" />
                                    <Text style={styles.storeAddress}>{item.address}</Text>
                                </View>
                                <View style={styles.statusContainer}>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(item.status) }
                                    ]}>
                                        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                                    </View>
                                    <Text style={styles.dateText}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                            {item.status === 'pending' && (
                                <View style={styles.actionsContainer}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.approveButton]}
                                        onPress={() => handleStatusChange(item.id, 'approved')}
                                    >
                                        <Text style={styles.actionText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.rejectButton]}
                                        onPress={() => handleStatusChange(item.id, 'rejected')}
                                    >
                                        <Text style={styles.actionText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fb',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#4A90E2',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterButton: {
        flex: 1,
        padding: 8,
        marginHorizontal: 4,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    activeFilter: {
        backgroundColor: '#4A90E2',
    },
    filterText: {
        color: '#333',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
    refreshButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    refreshText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 15,
    },
    storeCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    storeInfo: {
        marginBottom: 10,
    },
    storeName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    storeAddress: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        justifyContent: 'space-between',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
        marginLeft: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    actionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});