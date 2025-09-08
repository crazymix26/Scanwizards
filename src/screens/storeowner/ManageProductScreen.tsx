import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    Switch,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { useRoute } from '@react-navigation/native';

// Set up Supabase
const supabaseUrl = 'https://mybjttehecduzulururb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Ymp0dGVoZWNkdXp1bHVydXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTEyMzEsImV4cCI6MjA2ODEyNzIzMX0.JxyU7I54qAWoQBillFtpm-GaMzAaDc3oPj9iZUQwd08';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ManageProductScreen() {
    const route = useRoute();
    const { storeId } = route.params as { storeId: string };

    const [assignedProducts, setAssignedProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Fetch assigned products and their details (price, stock, availability)
    useEffect(() => {
        const fetchAssignedProducts = async () => {
            setLoading(true);
            try {
                // Fetch assigned products for this store from the store_products table
                const { data: storeProducts, error: storeProductsError } = await supabase
                    .from('store_products')
                    .select('product_barcode, price, stock, availability')
                    .eq('store_id', storeId);

                if (storeProductsError) throw storeProductsError;

                // If no assigned products, show empty state
                if (!storeProducts || storeProducts.length === 0) {
                    setAssignedProducts([]);
                    setLoading(false);
                    return;
                }

                const barcodes = storeProducts.map((product: any) => product.product_barcode);

                // Fetch product details for the assigned products
                const { data: productDetails, error: productDetailsError } = await supabase
                    .from('products')
                    .select('barcode, name')
                    .in('barcode', barcodes);

                if (productDetailsError) throw productDetailsError;

                // Merge the assigned products with their details
                const productsWithDetails = productDetails.map((product) => ({
                    ...product,
                    price: storeProducts.find((sp: any) => sp.product_barcode === product.barcode)?.price || 0,
                    stock: storeProducts.find((sp: any) => sp.product_barcode === product.barcode)?.stock || 0,
                    availability: storeProducts.find((sp: any) => sp.product_barcode === product.barcode)?.availability || true,
                }));

                setAssignedProducts(productsWithDetails);
            } catch (error) {
                console.error('Error fetching assigned products:', error);
                Alert.alert('Error', 'Failed to fetch assigned products. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchAssignedProducts();
    }, [storeId]);

    const handleSave = async (barcode: string, price: number, stock: number, availability: boolean) => {
        setSaving(barcode);
        try {
            // Update product details (price, stock, availability) for the assigned product in store_products table
            const { error } = await supabase
                .from('store_products')
                .update({ price, stock, availability })
                .eq('store_id', storeId)
                .eq('product_barcode', barcode);

            if (error) throw error;

            Alert.alert('Success', 'Product details updated successfully!');
        } catch (error) {
            console.error('Error saving product:', error);
            Alert.alert('Error', 'Failed to update product details.');
        } finally {
            setSaving(null);
        }
    };

    const handleDelete = async (barcode: string) => {
        setDeleting(barcode);
        try {
            // Delete the product from the store_products table
            const { error } = await supabase
                .from('store_products')
                .delete()
                .eq('store_id', storeId)
                .eq('product_barcode', barcode);

            if (error) throw error;

            // Remove the product from the UI
            setAssignedProducts(prevProducts =>
                prevProducts.filter(product => product.barcode !== barcode)
            );

            Alert.alert('Success', 'Product removed from store successfully!');
        } catch (error) {
            console.error('Error deleting product:', error);
            Alert.alert('Error', 'Failed to remove product from store.');
        } finally {
            setDeleting(null);
        }
    };

    const handleInputChange = (barcode: string, field: 'price' | 'stock' | 'availability', value: any) => {
        const updatedProducts = assignedProducts.map((product) => {
            if (product.barcode === barcode) {
                return {
                    ...product,
                    [field]: field === 'availability' ? value :
                        field === 'price' ? parseFloat(value) || 0 :
                            parseInt(value, 10) || 0
                };
            }
            return product;
        });
        setAssignedProducts(updatedProducts);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
                <Text style={styles.loadingText}>Loading product details...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Manage Store Products</Text>

                {assignedProducts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No products assigned to this store yet.</Text>
                    </View>
                ) : (
                    assignedProducts.map((product) => (
                        <View key={product.barcode} style={styles.productCard}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productBarcode}>Barcode: {product.barcode}</Text>

                            <View style={styles.inputRow}>
                                <Text style={styles.label}>Price (₱)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={product.price.toString()}
                                    keyboardType="decimal-pad"
                                    onChangeText={(value) => handleInputChange(product.barcode, 'price', value)}
                                    placeholder="0.00"
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={styles.label}>Stock</Text>
                                <TextInput
                                    style={styles.input}
                                    value={product.stock.toString()}
                                    keyboardType="numeric"
                                    onChangeText={(value) => handleInputChange(product.barcode, 'stock', value)}
                                    placeholder="0"
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={styles.label}>Available</Text>
                                <Switch
                                    value={product.availability}
                                    onValueChange={(value) => handleInputChange(product.barcode, 'availability', value)}
                                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                                    thumbColor={product.availability ? '#6c5ce7' : '#f4f3f4'}
                                />
                            </View>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.button, styles.saveButton]}
                                    onPress={() => handleSave(product.barcode, product.price, product.stock, product.availability)}
                                    disabled={saving === product.barcode}
                                >
                                    {saving === product.barcode ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.buttonText}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.deleteButton]}
                                    onPress={() => handleDelete(product.barcode)}
                                    disabled={deleting === product.barcode}
                                >
                                    {deleting === product.barcode ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.buttonText}>Remove</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    productBarcode: {
        fontSize: 12,
        color: '#666',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        flex: 1,
    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        fontSize: 14,
        flex: 1,
        marginLeft: 10,
        backgroundColor: '#fff',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    button: {
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    saveButton: {
        backgroundColor: '#6c5ce7',
    },
    deleteButton: {
        backgroundColor: '#e74c3c',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#636e72',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#636e72',
        textAlign: 'center',
    },
});

