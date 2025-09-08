import React, { useState, useEffect } from 'react';
import { TextInput, Button, Text, View, Alert } from 'react-native';
import { supabase } from '../../lib/supabase'; // Assuming this is your Supabase client

export default function ResetPasswordScreen({ route }: any) {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Get access_token from query params
    const { access_token } = route.params;

    useEffect(() => {
        if (!access_token) {
            Alert.alert('Error', 'Invalid or expired reset link.');
        }
    }, [access_token]);

    const handleResetPassword = async () => {
        if (!newPassword) {
            Alert.alert('Error', 'Please enter a new password.');
            return;
        }

        setLoading(true);

        try {
            // Reset the password using the new password
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                setErrorMessage(error.message);
                setLoading(false);
                return;
            }

            Alert.alert('Success', 'Your password has been reset successfully.');
            // Redirect to login or another page
            // navigation.navigate('Login');
        } catch (error) {
            setErrorMessage('Error resetting password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View>
            <Text>Enter your new password</Text>
            <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="New Password"
            />
            {errorMessage && <Text>{errorMessage}</Text>}
            <Button
                title={loading ? 'Resetting...' : 'Reset Password'}
                onPress={handleResetPassword}
                disabled={loading}
            />
        </View>
    );
}
