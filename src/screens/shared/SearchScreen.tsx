import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    InteractionManager,
    Dimensions,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { createClient } from '@supabase/supabase-js';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const supabaseUrl = 'https://mybjttehecduzulururb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Ymp0dGVoZWNkdXp1bHVydXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTEyMzEsImV4cCI6MjA2ODEyNzIzMX0.JxyU7I54qAWoQBillFtpm-GaMzAaDc3oPj9iZUQwd08';
const supabase = createClient(supabaseUrl, supabaseKey);

type RootStackParamList = {
    ResultScreen: { productData: any; storesData: any[]; loadingStores: boolean };
};

export default function SearchScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [searchQuery, setSearchQuery] = useState('');
    const [productDetails, setProductDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [storesCache, setStoresCache] = useState<Record<string, any[]>>({});

    // Pre-fetch stores when product is found
    useEffect(() => {
        if (productDetails && !storesCache[productDetails.id]) {
            const fetchStores = async () => {
                try {
                    const { data: stores } = await supabase
                        .from('stores')
                        .select('id,name,address,distance')
                        .eq('product_id', productDetails.id)
                        .order('distance', { ascending: true })
                        .limit(20);

                    setStoresCache(prev => ({
                        ...prev,
                        [productDetails.id]: stores || []
                    }));
                } catch (error) {
                    console.error('Prefetch error:', error);
                }
            };
            fetchStores();
        }
    }, [productDetails]);

    const searchProduct = async () => {
        const trimmedQuery = searchQuery.trim();

        if (!trimmedQuery) {
            Alert.alert('Error', 'Please enter a product name or barcode');
            return;
        }

        setIsLoading(true);
        setProductDetails(null);

        try {
            const { data: barcodeData, error: barcodeError } = await supabase
                .from('products')
                .select('*')
                .eq('barcode', trimmedQuery);

            const { data: nameData, error: nameError } = await supabase
                .from('products')
                .select('*')
                .ilike('name', `%${trimmedQuery}%`);

            if (barcodeError || nameError) throw barcodeError || nameError;

            const allResults = [...(barcodeData || []), ...(nameData || [])];
            const uniqueResults = allResults.filter(
                (v, i, a) => a.findIndex(t => t.id === v.id) === i
            );

            if (uniqueResults.length > 0) {
                setProductDetails(uniqueResults[0]);
            } else {
                Alert.alert('Not Found', 'No product matches your search');
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('Error', 'Failed to search products');
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToResultScreen = async () => {
        if (productDetails && !isNavigating) {
            setIsNavigating(true);

            try {
                const minimalProductData = {
                    id: productDetails.id,
                    name: productDetails.name,
                    barcode: productDetails.barcode,
                    description: productDetails.description
                };

                // Check if we have cached stores
                const cachedStores = storesCache[productDetails.id];

                // Navigate immediately with cached data or empty array
                navigation.navigate('ResultScreen', {
                    productData: minimalProductData,
                    storesData: cachedStores || [],
                    loadingStores: !cachedStores
                });

                // If no cached data, fetch fresh data and update
                if (!cachedStores) {
                    const { data: stores } = await supabase
                        .from('stores')
                        .select('id,name,address,distance')
                        .eq('product_id', productDetails.id)
                        .order('distance', { ascending: true })
                        .limit(20);

                    // Update the screen with fresh data
                    navigation.setParams({
                        storesData: stores || [],
                        loadingStores: false
                    });

                    // Cache the result for future use
                    setStoresCache(prev => ({
                        ...prev,
                        [productDetails.id]: stores || []
                    }));
                }
            } catch (error) {
                console.error('Navigation error:', error);
                // Update the screen to show error state
                navigation.setParams({
                    storesData: [],
                    loadingStores: false
                });
                Alert.alert('Error', 'Failed to load store data');
            } finally {
                setIsNavigating(false);
            }
        }
    };

    return (
        <LinearGradient
            colors={['#6a11cb', '#2575fc']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animatable.View
                animation="fadeInDown"
                duration={1000}
                style={styles.header}
            >
                <Text style={styles.title}>Product Search</Text>
                <Text style={styles.subtitle}>Find products by name or barcode</Text>
            </Animatable.View>

            <Animatable.View
                animation="fadeInUp"
                duration={1000}
                style={styles.footer}
            >
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter product name or barcode"
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={searchProduct}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.searchButton, (isLoading || !searchQuery.trim()) && styles.disabledButton]}
                    onPress={searchProduct}
                    disabled={isLoading || !searchQuery.trim()}
                    activeOpacity={0.7}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.searchButtonText}>Search Product</Text>
                    )}
                </TouchableOpacity>

                {productDetails && (
                    <Animatable.View
                        animation="fadeIn"
                        duration={600}
                        style={styles.productCard}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.productName}>{productDetails.name}</Text>
                        </View>
                        <Text style={styles.productBarcode}>Barcode: {productDetails.barcode}</Text>
                        {productDetails.description && (
                            <Text style={styles.productDescription}>{productDetails.description}</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.viewStoresButton, isNavigating && styles.disabledButton]}
                            onPress={navigateToResultScreen}
                            disabled={isNavigating}
                            activeOpacity={0.7}
                        >
                            {isNavigating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <MaterialIcons name="store" size={20} color="white" />
                                    <Text style={styles.viewStoresText}>
                                        {storesCache[productDetails.id]
                                            ? 'View Available Stores'
                                            : 'Loading Stores...'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animatable.View>
                )}
            </Animatable.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
    },
    footer: {
        flex: 2,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 20,
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
    searchIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#333',
    },
    searchButton: {
        backgroundColor: '#6a11cb',
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#6a11cb',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    disabledButton: {
        opacity: 0.6,
    },
    searchButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    productCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginTop: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
                borderWidth: 1,
                borderColor: '#f0f0f0',
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    productBarcode: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    viewStoresButton: {
        backgroundColor: '#2575fc',
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewStoresText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    productDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        fontStyle: 'italic',
    },
});
