import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Set up Supabase
const supabaseUrl = 'https://mybjttehecduzulururb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Ymp0dGVoZWNkdXp1bHVydXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTEyMzEsImV4cCI6MjA2ODEyNzIzMX0.JxyU7I54qAWoQBillFtpm-GaMzAaDc3oPj9iZUQwd08';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AddProductScreen() {
    const [productName, setProductName] = useState('');
    const [productBarcode, setProductBarcode] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
    const navigation = useNavigation();

    const handleAddProduct = async () => {
        // Validate inputs
        if (!productName || !productBarcode || !productDescription) {
            setMessage('Please fill in all fields');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setMessageType(null);

        try {
            const { error } = await supabase.from('products').insert([{
                name: productName.trim(),
                barcode: productBarcode.trim(),
                description: productDescription.trim(),
            }]);

            if (error) throw error;

            setMessage('Product added successfully!');
            setMessageType('success');

            // Reset form
            setProductName('');
            setProductBarcode('');
            setProductDescription('');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setMessage('');
                setMessageType(null);
            }, 3000);

        } catch (error) {
            console.error('Error adding product:', error);
            setMessage(error instanceof Error ? error.message : 'Failed to add product');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#6c5ce7', '#0984e3']}
                style={styles.headerGradient}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Product</Text>
                <Text style={styles.headerSubtitle}>Fill in the product details</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Product Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter product name"
                        placeholderTextColor="#999"
                        value={productName}
                        onChangeText={setProductName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Barcode *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter barcode number"
                        placeholderTextColor="#999"
                        value={productBarcode}
                        onChangeText={setProductBarcode}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description *</Text>
                    <TextInput
                        style={[styles.input, styles.descriptionInput]}
                        placeholder="Enter product description"
                        placeholderTextColor="#999"
                        value={productDescription}
                        onChangeText={setProductDescription}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {message && (
                    <View style={[
                        styles.messageContainer,
                        messageType === 'success' && styles.successMessage,
                        messageType === 'error' && styles.errorMessage
                    ]}>
                        <Ionicons
                            name={messageType === 'success' ? "checkmark-circle" : "warning"}
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.messageText}>{message}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!productName || !productBarcode || !productDescription) &&
                        styles.disabledButton
                    ]}
                    onPress={handleAddProduct}
                    disabled={!productName || !productBarcode || !productDescription || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="add-circle" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Add Product</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 5,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3436',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: '#2d3436',
        borderWidth: 1,
        borderColor: '#dfe6e9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    descriptionInput: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6c5ce7',
        padding: 16,
        borderRadius: 10,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    disabledButton: {
        backgroundColor: '#b2bec3',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 10,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginVertical: 15,
    },
    successMessage: {
        backgroundColor: '#00b894',
    },
    errorMessage: {
        backgroundColor: '#e74c3c',
    },
    messageText: {
        color: '#fff',
        marginLeft: 10,
        fontSize: 14,
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 30,
        padding: 10,
        zIndex: 1,
    },
});
