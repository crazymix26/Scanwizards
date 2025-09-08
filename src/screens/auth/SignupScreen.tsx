// app/auth/Signup.tsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { SimpleLineIcons, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { fontFamily } from '../../Styles/fontFamily';

type SignupScreenProps = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function Signup({ navigation }: SignupScreenProps) {
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [fullName, setFullName] = useState(''); // Add full name field
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        setLoading(true);
        try {
            // Validate inputs
            if (!fullName.trim() || !email.trim() || !password) {
                Alert.alert('Error', 'Please fill all fields');
                setLoading(false);
                return;
            }

            // 1. Create auth user
            const { data: { user }, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        phone,
                        full_name: fullName
                    }
                }
            });

            if (authError) {
                throw new Error(authError.message || 'Authentication failed');
            }

            // 2. Check if the profile already exists in the database
            const { data: existingProfile, error: fetchProfileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user?.id)
                .single();

            if (fetchProfileError && fetchProfileError.code !== 'PGRST116') { // Handle unexpected errors
                throw new Error(fetchProfileError.message || 'Failed to fetch existing profile');
            }



            Alert.alert(
                'Success',
                'Account created! Please check your email for verification.'
            );
            navigation.navigate('Login');
        } catch (error: any) {
            console.error('Signup error:', error);

            let errorMessage = 'Could not create account';
            if (error.message) {
                errorMessage = error.message;

                // Handle specific RLS error
                if (error.message.includes('row-level security policy')) {
                    errorMessage = 'Profile creation permission denied';
                }
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };


    

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Let's get started</Text>

            {/* Add Full Name Field */}
            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#000" />
                    <TextInput
                        style={styles.textInput}
                        placeholder="Full Name"
                        placeholderTextColor={Colors.light.text}
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                    />
                </View>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#000" />
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your email"
                        placeholderTextColor={Colors.light.text}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#000" />
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your phone no"
                        placeholderTextColor={Colors.light.text}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                </View>
            </View>

            <View style={[styles.formContainer, { marginBottom: 30 }]}>
                <View style={styles.inputContainer}>
                    <SimpleLineIcons name="lock" size={20} color="#000" />
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your password"
                        placeholderTextColor={Colors.light.text}
                        secureTextEntry={secureTextEntry}
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                          <Ionicons
                                                    name={secureTextEntry ? "eye" : "eye-off"}
                                                    size={20}
                                                    color="#000"
                                                />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleSignup}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sign up</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.or}>or continue with</Text>

            <TouchableOpacity style={styles.googleButton}>
                <Image
                    source={require('../../assets/images/googlelogo.png')}
                    style={styles.googleImage}
                />
                <Text style={styles.googleText}>Google</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
                Already have an account?{' '}
                <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
                    Login
                </Text>
            </Text>

        </View>
    );
}

// ... keep your existing styles ...

const styles = StyleSheet.create({
    // Layout containers
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#D5DEEF',
    },
    formContainer: {
        marginTop: 20,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        padding: 2,
        marginVertical: 1,
    },
    textInput: {
        flex: 1,
        padding: 10,
        fontSize: 16,
        paddingHorizontal: 10,
        fontFamily: 'Inter_400Regular',
    },

    // Text styles
    title: {
        fontSize: 26,
        fontFamily: fontFamily.bold,
        color: '#333',
        marginBottom: 20,
    },
    or: {
        textAlign: 'center',
        marginVertical: 10,
        fontFamily: fontFamily.medium,
        color: '#666',
    },
    footer: {
        textAlign: 'center',
    },
    link: {
        color: '#007AFF',
    },

    // Button styles
    button: {
        backgroundColor: '#333',
        borderRadius: 25,
        padding: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    googleButton: {
        borderWidth: 1,
        borderRadius: 25,
        padding: 13,
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        borderColor: '#ddd',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        fontFamily: fontFamily.medium,
    },
    googleImage: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
});