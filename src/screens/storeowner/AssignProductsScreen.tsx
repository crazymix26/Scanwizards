import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { createClient } from '@supabase/supabase-js';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const supabaseUrl = 'https://mybjttehecduzulururb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Ymp0dGVoZWNkdXp1bHVydXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTEyMzEsImV4cCI6MjA2ODEyNzIzMX0.JxyU7I54qAWoQBillFtpm-GaMzAaDc3oPj9iZUQwd08';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AssignProductScreen() {
    const { storeId } = useRoute().params as { storeId: string };
    const navigation = useNavigation();
    const [productList, setProductList] = useState<{
        barcode: string;
        name: string;
        isAssigned: boolean;
    }[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch available products and check assignment status
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Fetch all products
                const { data: products, error: productsError } = await supabase
                    .from('products')
                    .select('barcode, name')
                    .order('name', { ascending: true });

                if (productsError) throw productsError;

                // Fetch already assigned products for this store
                const { data: assignedProducts, error: assignedError } = await supabase
                    .from('store_products')
                    .select('product_barcode')
                    .eq('store_id', storeId);

                if (assignedError) throw assignedError;

                const assignedBarcodes = assignedProducts.map(p => p.product_barcode);

                // Merge products with assignment status
                const mergedProducts = (products || []).map(product => ({
                    ...product,
                    isAssigned: assignedBarcodes.includes(product.barcode)
                }));

                setProductList(mergedProducts);
            } catch (error) {
                console.error('Error fetching products:', error);
                Alert.alert('Error', 'Failed to fetch products. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [storeId]);

    const handleAssignProducts = async () => {
        if (selectedProducts.length === 0) {
            Alert.alert('Selection Required', 'Please select at least one product to assign.');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('store_products')
                .insert(
                    selectedProducts.map((barcode) => ({
                        store_id: storeId,
                        product_barcode: barcode,
                    }))
                );

            if (error) throw error;

            // Update the product list to mark these as assigned
            setProductList(prev => prev.map(product =>
                selectedProducts.includes(product.barcode)
                    ? { ...product, isAssigned: true }
                    : product
            ));

            Alert.alert(
                'Success',
                `${selectedProducts.length} product(s) assigned successfully!`,
                [
                    {
                        text: 'OK',
                        onPress: () => setSelectedProducts([])
                    }
                ]
            );
        } catch (error) {
            console.error('Error assigning products:', error);
            Alert.alert('Error', 'Failed to assign products. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleProductSelection = (barcode: string, isAssigned: boolean) => {
        if (isAssigned) return; // Don't allow selection if already assigned

        setSelectedProducts(prev =>
            prev.includes(barcode)
                ? prev.filter(item => item !== barcode)
                : [...prev, barcode]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
                <Text style={styles.loadingText}>Loading products...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#6c5ce7', '#0984e3']}
                style={styles.headerGradient}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.title}>Assign Products</Text>
                        <Text style={styles.subtitle}>Select products to add to your store</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {productList.length === 0 && !loading ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="pricetags-outline" size={48} color="#b2bec3" />
                        <Text style={styles.emptyText}>No products available</Text>
                    </View>
                ) : (
                    productList.map((product) => (
                        <TouchableOpacity
                            key={product.barcode}
                            style={[
                                styles.productItem,
                                selectedProducts.includes(product.barcode) && styles.selectedProduct,
                                product.isAssigned && styles.assignedProduct
                            ]}
                            onPress={() => toggleProductSelection(product.barcode, product.isAssigned)}
                            activeOpacity={product.isAssigned ? 1 : 0.7}
                            disabled={product.isAssigned}
                        >
                            <Checkbox
                                status={
                                    product.isAssigned ? 'checked' :
                                        selectedProducts.includes(product.barcode) ? 'checked' : 'unchecked'
                                }
                                color="#6c5ce7"
                                uncheckedColor="#636e72"
                                disabled={product.isAssigned}
                            />
                            <View style={styles.productInfo}>
                                <Text style={[styles.productName, product.isAssigned && styles.assignedText]}>
                                    {product.name}
                                </Text>
                                <Text style={styles.barcode}>#{product.barcode}</Text>
                                {product.isAssigned && (
                                    <Text style={styles.assignedLabel}>Already assigned</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Text style={styles.selectionCount}>
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </Text>

                <TouchableOpacity
                    style={[styles.assignButton, selectedProducts.length === 0 && styles.disabledButton]}
                    onPress={handleAssignProducts}
                    disabled={selectedProducts.length === 0 || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.assignButtonText}>Assign Products</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    headerGradient: {
        paddingVertical: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTextContainer: {
        flex: 1,
        marginHorizontal: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f6fa',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#636e72',
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    productInfo: {
        flex: 1,
    },
    selectedProduct: {
        backgroundColor: '#f0f3ff',
        borderWidth: 1,
        borderColor: '#6c5ce7',
    },
    assignedProduct: {
        backgroundColor: '#f5f5f5',
        opacity: 0.7,
    },
    productName: {
        fontSize: 16,
        color: '#2d3436',
        marginLeft: 10,
    },
    assignedText: {
        color: '#636e72',
    },
    barcode: {
        fontSize: 12,
        color: '#636e72',
        marginLeft: 10,
    },
    assignedLabel: {
        fontSize: 12,
        color: '#00b894',
        marginLeft: 10,
        marginTop: 4,
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#dfe6e9',
        backgroundColor: '#fff',
    },
    selectionCount: {
        textAlign: 'center',
        color: '#636e72',
        marginBottom: 15,
        fontSize: 14,
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6c5ce7',
        padding: 16,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    disabledButton: {
        backgroundColor: '#b2bec3',
    },
    assignButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 10,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#636e72',
        marginTop: 15,
        textAlign: 'center',
    },
});
