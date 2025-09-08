import React, { useState } from 'react';
import { View, Text, Button, Alert, ActivityIndicator } from 'react-native';
import { createAdminUser } from '../../utils/adminSignup';

export default function AdminSetupScreen() {
    const [loading, setLoading] = useState(false);

    const setupAdmin = async () => {
        setLoading(true);
        try {
            const admin = await createAdminUser('reyneilrodelas29@gmail.com', 'AdImIn@_26');
            if (admin) {
                Alert.alert(
                    'Admin Created',
                    `Successfully created admin account for ${admin.email}`,
                    [{ text: 'OK', onPress: () => { } }]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create admin account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
                Admin Account Setup
            </Text>
            <Button
                title={loading ? "Creating..." : "Create Admin Account"}
                onPress={setupAdmin}
                disabled={loading}
            />
            {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
        </View>
    );
}