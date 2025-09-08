import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
    Animated,
    Easing,
    ScrollView
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';
import { CommonActions } from '@react-navigation/native';

type UserProfile = {
    username: string;
    email: string;
    address: string;
    avatar_url?: string;
    is_admin?: boolean;
};

export default function ProfileScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastFetched, setLastFetched] = useState<number | null>(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [aboutExpanded, setAboutExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const animationHeight = useRef(new Animated.Value(0)).current;
    const arrowRotation = animationHeight.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    const maxHeight = animationHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 120]
    });

    const toggleAbout = () => {
        setAboutExpanded(!aboutExpanded);
        Animated.timing(animationHeight, {
            toValue: aboutExpanded ? 0 : 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: false
        }).start();
    };

    const cacheProfile = async (profileData: UserProfile) => {
        try {
            await AsyncStorage.setItem('profileCache', JSON.stringify(profileData));
        } catch (error) {
            console.error('Caching failed:', error);
        }
    };

    const getCachedProfile = async () => {
        try {
            const cached = await AsyncStorage.getItem('profileCache');
            return cached ? JSON.parse(cached) as UserProfile : null;
        } catch (error) {
            console.error('Cache read failed:', error);
            return null;
        }
    };

    const fetchProfile = async (force = false) => {
        try {
            setLoading(true);
            setError(null);

            if (force) {
                setRefreshKey(prev => prev + 1);
            }

            if (!force) {
                const cachedProfile = await getCachedProfile();
                if (cachedProfile) {
                    setProfile(cachedProfile);
                }
            }

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw authError || new Error('No user logged in');

            const { data, error: profileError } = await supabase
                .from('profiles')
                .select('username, address, avatar_url, is_admin')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            const profileData = {
                username: data.username || 'User',
                email: user.email || '',
                address: data.address || 'No address provided',
                avatar_url: data.avatar_url ? `${data.avatar_url}?ts=${Date.now()}` : undefined,
                is_admin: data.is_admin || false
            };

            setProfile(profileData);
            await cacheProfile(profileData);
            setLastFetched(Date.now());
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            console.error('Profile fetch error:', error);
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
            setAvatarLoading(false);
        }
    };

    const debouncedFetch = useRef(
        debounce(async (force: boolean) => {
            await fetchProfile(force);
        }, 500)
    ).current;

    useEffect(() => {
        const now = Date.now();
        const refreshed = (route as any)?.params?.refreshed;

        if (!lastFetched || refreshed || (lastFetched && now - lastFetched > 30000)) {
            debouncedFetch(!!refreshed);
        }

        return () => debouncedFetch.cancel();
    }, [(route as any)?.params?.refreshed]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProfile(true);
        });
        return unsubscribe;
    }, [navigation]);

    const handleLogout = async () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    onPress: async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) Alert.alert('Error', error.message);
                        else navigation.replace('Login');
                    }
                }
            ]
        );
    };

    const handleShopPress = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();

        // Navigate to "My Shop" directly if the user is logged in, without any login check
        if (user) {
            navigation.navigate('StoreOwner', { screen: 'MyShop' });
        } else {
            // If needed, you can handle cases where the user is not logged in in other ways
            // For now, we assume the user is logged in and go directly to the shop
            console.log('User not logged in.');
        }
    };



    if (loading && !profile) {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                </View>
            </ScrollView>
        );
    }

    if (error && !profile) {
        return (
            <ScrollView contentContainerStyle={[styles.container, styles.errorContainer]}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={[styles.actionButton, styles.retryButton]}
                    onPress={() => fetchProfile(true)}
                >
                    <Text style={styles.actionButtonText}>Try Again</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                    <Image
                        key={`avatar-${refreshKey}`}
                        source={!avatarError && profile?.avatar_url
                            ? { uri: profile.avatar_url }
                            : require('../../assets/images/default.png')}
                        style={styles.avatar}
                        resizeMode="cover"
                        onLoadStart={() => setAvatarLoading(true)}
                        onLoadEnd={() => setAvatarLoading(false)}
                        onError={() => setAvatarError(true)}
                    />
                    {avatarLoading && (
                        <ActivityIndicator
                            style={styles.avatarLoadingIndicator}
                            color="#7C3AED"
                            size="large"
                        />
                    )}
                    <TouchableOpacity
                        style={styles.editAvatarButton}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <MaterialIcons name="edit" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.username}>{profile?.username}</Text>
                <Text style={styles.email}>{profile?.email}</Text>
            </View>

            {/* User Info Card */}
            <View style={styles.infoCard}>
                <View style={styles.infoItem}>
                    <MaterialIcons name="location-on" size={20} color="#7C3AED" />
                    <Text style={styles.infoText}>{profile?.address || 'No address provided'}</Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                {profile?.is_admin && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.adminButton]}
                        onPress={() => navigation.navigate('AdminDashboard')}
                    >
                        <MaterialIcons name="admin-panel-settings" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Admin Dashboard</Text>
                    </TouchableOpacity>
                )}

                {profile?.is_admin ? null : (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.shopButton]}
                        onPress={handleShopPress}
                    >
                        <FontAwesome name="shopping-bag" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>My Shop</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.actionButton, styles.logoutButton]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Log Out</Text>
                </TouchableOpacity>
            </View>

            {/* About Section */}
            <View style={styles.aboutContainer}>
                <TouchableOpacity
                    style={styles.aboutHeader}
                    onPress={toggleAbout}
                    activeOpacity={0.8}
                >
                    <Text style={styles.sectionTitle}>About this app</Text>
                    <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
                        <MaterialIcons
                            name="keyboard-arrow-down"
                            size={24}
                            color="#7C3AED"
                        />
                    </Animated.View>
                </TouchableOpacity>

                <Animated.View style={[styles.aboutContent, { maxHeight, opacity: aboutExpanded ? 1 : 0 }]}>
                    <Text style={styles.aboutText}>
                        ScanWizard Application allows users to locate the nearest stores in their
                        area that offer the products they need through scanning.
                    </Text>
                </Animated.View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F9FAFB',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 16,
        paddingHorizontal: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#EDE9FE',
    },
    avatarLoadingIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    editAvatarButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#7C3AED',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    username: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#6B7280',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 12,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        minWidth: '48%',
        flex: 1,
    },
    shopButton: {
        backgroundColor: '#7C3AED',
    },
    adminButton: {
        backgroundColor: '#10B981',
    },
    logoutButton: {
        backgroundColor: '#EF4444',
    },
    retryButton: {
        backgroundColor: '#7C3AED',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    aboutContainer: {
        marginBottom: 24,
    },
    aboutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#EDE9FE',
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#7C3AED',
    },
    aboutContent: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        overflow: 'hidden',
    },
    aboutText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#4B5563',
        paddingVertical: 16,
    },
});
