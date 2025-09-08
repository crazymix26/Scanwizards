import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../types/navigation';

type AdminDashboardScreenProps = {
    navigation: NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;
};

export default function AdminDashboardScreen({ navigation }: AdminDashboardScreenProps) {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Approvals')}
            >
                <MaterialIcons name="store" size={24} color="#7C3AED" />
                <Text style={styles.menuText}>Store Approvals</Text>
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("AdminSetup")}
            >
                <MaterialIcons name="home" size={24} color="#7C3AED" />
                <Text style={styles.menuText}>Admin Setup </Text>
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("AllStores")}
            >
                <MaterialIcons name="store" size={24} color="#7C3AED" />
                <Text style={styles.menuText}>View All Store </Text>
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#F9FAFB',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#1F2937',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    menuText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        color: '#374151',
    },
});