import React, { useState, useEffect, useRef } from 'react';
import {
    Animated,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { SimpleLineIcons, Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Helper function to verify admin status
const verifyAdmin = async (): Promise<boolean> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return !error && user?.user_metadata?.role === 'admin';
};

export default function LoginScreen({ navigation }: Props) {
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false); // Loading state for Login button
    const [googleLoading, setGoogleLoading] = useState(false); // Loading state for Google button
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Check for existing session
        checkSession();

        // Listen for authentication state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
            if (session) {
                await handlePostLoginNavigation(session.user);
            }
        });

        // Cleanup listener
        return () => subscription.unsubscribe();
    }, [navigation]);

    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await handlePostLoginNavigation(session.user);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email first');
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            Alert.alert('Success', 'Password reset link sent to your email');
        } catch (error) {
            Alert.alert('Error', (error as any).message);
        }
    };

    const handlePostLoginNavigation = async (user: any) => {
        try {
            // 1. Get current user session
            const { data: { user: currentUser }, error } = await supabase.auth.getUser();
            if (error) throw error;

            // 2. Check admin status (but don't navigate differently)
            const isAdmin = await verifyAdmin();

            // 3. All users go to Main screen
            // We can show the user’s dashboard or main content screen here
            Alert.alert("Login Successful", "Welcome!");

            // 4. Optional: Show admin welcome message
            if (isAdmin) {
                setTimeout(() => Alert.alert(
                    'Welcome Admin!',
                    'You can access admin features from your profile.'
                ), 1000);
            }
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert('Error', 'Failed to authenticate user');
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoginLoading(true);  // Set loading to true for login button
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });

            if (error) {
                let errorMessage = error.message;

                if (error.status === 400) {
                    errorMessage = 'Invalid email or password';
                } else if (error.status === 401) {
                    errorMessage = 'Email not verified. Please check your inbox.';
                }

                throw new Error(errorMessage);
            }

            const { data: { user } } = await supabase.auth.getUser();
            const isAdmin = user?.user_metadata?.role === 'admin';

            if (isAdmin) {
                Alert.alert("Admin Access", "Welcome to the admin panel!");
            } else {
                Alert.alert("User Access", "Welcome to the main app!");
            }
        } catch (error: any) {
            Alert.alert(
                'Login Failed',
                error.message || 'Authentication error occurred'
            );
            console.error('Login error details:', { email, error: JSON.stringify(error, null, 2) });
        } finally {
            setLoginLoading(false);  // Set loading to false for login button after request completes
        }
    };

    const handleGoogleAuth = async () => {
        setGoogleLoading(true);  // Set loading to true for Google button
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'exp://your-app-url.auth/callback',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
        } catch (error: any) {
            Alert.alert('Google Login Error', error.message || 'An error occurred during Google login');
            setGoogleLoading(false);  // Set loading to false if there's an error
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Hey, Welcome Back</Text>

            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#000" />
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your email"
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        editable={!loginLoading && !googleLoading}
                    />
                </View>
            </View>

            <View style={[styles.formContainer, { marginBottom: 20 }]}>
                <View style={styles.inputContainer}>
                    <SimpleLineIcons name="lock" size={20} color="#000" />
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your password"
                        placeholderTextColor="#666"
                        secureTextEntry={secureTextEntry}
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                        editable={!loginLoading && !googleLoading}
                    />
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSecureTextEntry(!secureTextEntry);
                        }}
                        disabled={loginLoading || googleLoading}
                    >
                        <Ionicons
                            name={secureTextEntry ? "eye" : "eye-off"}
                            size={20}
                            color="#000"
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity
                style={[styles.forgotContainer, loginLoading && { opacity: 0.7 }]}
                onPress={handlePasswordReset} // Call handlePasswordReset when the link is pressed
                disabled={loginLoading}
            >
                <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, loginLoading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loginLoading}  // Disable login button while loading
            >
                {loginLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Login</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.or}>or continue with</Text>

            <TouchableOpacity
                style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
                onPress={handleGoogleAuth}
                disabled={googleLoading}  // Disable Google button while loading
            >
                <Image
                    source={require('../../assets/images/googlelogo.png')}
                    style={styles.googleImage}
                />
                {googleLoading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={styles.googleText}>Google</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.footer}>
                Don't have an account?{' '}
                <Text
                    style={styles.link}
                    onPress={() => !loginLoading && !googleLoading && navigation.navigate('Signup')}
                >
                    Sign up
                </Text>
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
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
        borderColor: 'black',
    },
    textInput: {
        flex: 1,
        padding: 10,
        fontSize: 16,
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 25,
        textAlign: 'center',
    },
    forgot: {
        textAlign: 'right',
        color: '#007AFF',
        marginBottom: 20,
        paddingTop: 10,
    },
    or: {
        textAlign: 'center',
        marginVertical: 10,
        color: '#666',
        fontWeight: '500',
    },
    footer: {
        textAlign: 'center',
        marginTop: 10,
        color: '#666',
    },
    link: {
        color: '#007AFF',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#333',
        borderRadius: 25,
        padding: 15,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    googleButton: {
        borderWidth: 1,
        borderRadius: 25,
        padding: 15,
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
    forgotContainer: { alignSelf: 'flex-end', marginBottom: 10 },
});
