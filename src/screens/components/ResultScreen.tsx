import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';

const supabaseUrl = 'https://mybjttehecduzulururb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Ymp0dGVoZWNkdXp1bHVydXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTEyMzEsImV4cCI6MjA2ODEyNzIzMX0.JxyU7I54qAWoQBillFtpm-GaMzAaDc3oPj9iZUQwd08';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Store {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    status: string;
}

interface StoreProduct {
    product_barcode: string;
    price: number | null;
    stock: number | null;
    availability: boolean;
    stores: Store[];
}

interface ProductData {
    barcode: string;
    name: string;
    image?: string;
    description?: string;
}

export default function ResultScreen({ route, navigation }: any) {
    const { productData }: { productData: ProductData } = route.params;
    const [storeData, setStoreData] = useState<StoreProduct[]>([]);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [productData]);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            setLoading(true);

            // Get user location
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'We need location permission to show nearby stores.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            // Fetch stores with the product
            const { data, error } = await supabase
                .from('store_products')
                .select(`
                    product_barcode,
                    price,
                    stock,
                    availability,
                    stores:store_id (
                        id,
                        name,
                        address,
                        latitude,
                        longitude,
                        status
                    )
                `)
                .eq('product_barcode', productData.barcode.trim())
                .eq('stores.status', 'approved')
                .not('store_id', 'is', null)
                .not('stores.id', 'is', null);

            if (error) throw error;

            const validatedData = (data || [])
                .map(item => {
                    const stores = Array.isArray(item.stores) ? item.stores : [item.stores];
                    const validStores = stores.filter(store =>
                        store?.id &&
                        store.latitude &&
                        store.longitude &&
                        store.status === 'approved'
                    );
                    return {
                        product_barcode: item.product_barcode,
                        price: item.price,
                        stock: item.stock,
                        availability: item.availability !== undefined ? item.availability : (item.stock !== null && item.stock > 0),
                        stores: validStores
                    };
                })
                .filter(item => item.stores.length > 0);

            setStoreData(validatedData);

        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load store data. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const handleNavigateToMap = () => {
        if (storeData.length > 0 && userLocation) {
            const validStores = storeData.flatMap(item =>
                item.stores.filter(store => store?.id)
            );
            navigation.navigate('MapScreen', {
                storeData: validStores,
                userLocation
            });
        }
    };

    const handleBackButtonPress = () => {
        navigation.goBack();
    };

    const handleRefresh = () => {
        fetchData();
    };

    const renderStoreItem = ({ item, index }: { item: StoreProduct; index: number }) => {
        // Skip rendering if no valid stores
        if (!item.stores || item.stores.length === 0 || !item.stores[0]?.id) {
            return null;
        }

        const store = item.stores[0];
        const storeName = store.name || 'Unknown Store';
        const price = item.price ? `₱${item.price.toFixed(2)}` : 'Price not available';
        const address = store.address || 'Address not available';
        const isAvailable = item.availability;

        let distance = 'Distance not available';
        if (userLocation && store.latitude && store.longitude) {
            const dist = getDistance(
                userLocation.latitude,
                userLocation.longitude,
                store.latitude,
                store.longitude
            );
            distance = dist < 1 ?
                `${(dist * 1000).toFixed(0)} meters` :
                `${dist.toFixed(1)} km`;
        }

        return (
            <TouchableOpacity
                style={[
                    styles.storeItem,
                    index === 0 && styles.firstStoreItem,
                    index === storeData.length - 1 && styles.lastStoreItem
                ]}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.storeIconContainer,
                    isAvailable ? styles.availableStore : styles.unavailableStore
                ]}>
                    <MaterialIcons
                        name={isAvailable ? "store" : "store-mall-directory"}
                        size={28}
                        color="#FFF"
                    />
                </View>
                <View style={styles.storeInfo}>
                    <Text style={styles.storeName} numberOfLines={1}>{storeName}</Text>
                    <Text style={styles.storeAddress} numberOfLines={1}>{address}</Text>
                    <View style={styles.distanceRow}>
                        <MaterialIcons name="location-on" size={16} color="#666" />
                        <Text style={styles.distanceText}>{distance}</Text>
                    </View>
                    <Text style={styles.priceText}>{price}</Text>
                    <View style={[
                        styles.availabilityBadge,
                        isAvailable ? styles.availableBadge : styles.unavailableBadge
                    ]}>
                        <Text style={styles.availabilityText}>
                            {isAvailable ? 'Available' : 'Out of Stock'}
                        </Text>
                    </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6a11cb" />
                <Text style={styles.loadingText}>Finding stores...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackButtonPress} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Availability</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            {/* Product Card */}
            <View style={styles.productCard}>
                {productData.image && (
                    <Image
                        source={{ uri: productData.image }}
                        style={styles.productImage}
                        resizeMode="contain"
                    />
                )}
                <View style={styles.productTextContainer}>
                    <Text style={styles.productName} numberOfLines={2}>
                        {productData.name || 'Product'}
                    </Text>
                    <Text style={styles.productBarcode}>Barcode: {productData.barcode}</Text>
                    {productData.description && (
                        <Text style={styles.productDescription} numberOfLines={3}>
                            {productData.description}
                        </Text>
                    )}
                </View>
            </View>

            {/* Results Section */}
            <View style={styles.resultsContainer}>
                <Text style={styles.sectionTitle}>
                    <MaterialIcons name="shopping-cart" size={20} color="#0066ec" />{' '}
                    Available at {storeData.length} {storeData.length === 1 ? 'store' : 'stores'}
                </Text>

                <FlatList
                    data={storeData}
                    renderItem={renderStoreItem}
                    keyExtractor={(item, index) => `${item.stores[0]?.id || `fallback-${index}`}`}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#6a11cb']}
                            tintColor={'#6a11cb'}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="store-mall-directory" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No stores found with this product</Text>
                            <Text style={styles.emptySubtext}>
                                This product may not be available in nearby stores
                            </Text>
                            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                                <MaterialIcons name="refresh" size={20} color="#FFF" />
                                <Text style={styles.refreshButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />

                {storeData.length > 0 && (
                    <TouchableOpacity
                        onPress={handleNavigateToMap}
                        style={styles.mapButton}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="map" size={22} color="#FFF" />
                        <Text style={styles.mapButtonText}>View on Map</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#6a11cb',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerRightPlaceholder: {
        width: 24,
    },
    backButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: -30,
        borderRadius: 12,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 1,
        borderColor: '#6a11cb',
        borderWidth: 4,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
        backgroundColor: '#F5F5F5',
    },
    productTextContainer: {
        flex: 1,
    },
    productName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    productBarcode: {
        fontSize: 14,
        color: '#000',
        marginBottom: 3,
        fontWeight: 'bold',
        marginTop: 4,
    },
    productDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        fontWeight: 'bold',
    },
    resultsContainer: {
        flex: 1,
        paddingTop: 20,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 20,
    },
    storeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        marginBottom: 8,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#6a11cb',
        elevation: 1,
    },
    firstStoreItem: {
        marginTop: 4,
    },
    lastStoreItem: {
        marginBottom: 20,
    },
    storeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    availableStore: {
        backgroundColor: '#4CAF50',
    },
    unavailableStore: {
        backgroundColor: '#F44336',
    },
    storeInfo: {
        flex: 1,
    },
    storeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    storeAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    distanceText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 6,
    },
    availabilityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    availableBadge: {
        backgroundColor: '#E8F5E9',
    },
    unavailableBadge: {
        backgroundColor: '#FFEBEE',
    },
    availabilityText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        textAlign: 'center',
        fontSize: 14,
        color: '#999',
        marginBottom: 20,
        paddingHorizontal: 40,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6a11cb',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        elevation: 2,
    },
    refreshButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6a11cb',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        elevation: 2,
    },
    mapButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
});