import React from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type RootStackParamList = {
    Home: undefined;
    Scanner: undefined;
    AddProduct: undefined;
    AddStore: undefined;
};

export default function HomeScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();

    const handleGoToScanner = () => {
        navigation.navigate('Scanner');  // Navigate to Scanner Screen when the button is pressed
    };

    return (
        <View style={styles.container}>

            <Image
                source={require('../../assets/images/homelogo.png')} // Replace with your image
                style={styles.image}
                resizeMode="contain"
            />

            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>Quickly scan a product to explore details and nearby stores.</Text>

            <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('Scanner')}
                activeOpacity={0.8}
            >
                <Ionicons name="scan" size={24} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.scanButtonText}>Scan the Product</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff3e5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    subtitle: {
    fontSize: 16,
    color: 'Black',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
    },
    image: {
        marginTop: 10,
        width: width * 1,
        height: width * 1,
        marginBottom: 5,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f3c88',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
