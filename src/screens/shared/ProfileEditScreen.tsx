import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
    Animated,
    Easing,
    ScrollView,
    Dimensions
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type UserProfile = {
    username: string;
    email: string;
    address: string;
    avatar_url: string | null;
};

export default function ProfileEditScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [profile, setProfile] = useState<UserProfile>({
        username: '',
        email: '',
        address: '',
        avatar_url: null
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) throw userError || new Error('No user logged in');

                const { data, error } = await supabase
                    .from('profiles')
                    .select('username, address, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                const cleanAvatarUrl = data?.avatar_url
                    ? `${data.avatar_url.split('?')[0]}?ts=${Date.now()}`
                    : null;

                setProfile({
                    username: data?.username || '',
                    email: user.email || '',
                    address: data?.address || '',
                    avatar_url: cleanAvatarUrl
                });
            } catch (error) {
                console.error('Fetch profile error:', error);
                Alert.alert(
                    'Error',
                    error instanceof Error ? error.message : 'Failed to load profile'
                );
            } finally {
                setLoading(false);
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideUpAnim, {
                        toValue: 0,
                        duration: 600,
                        easing: Easing.out(Easing.exp),
                        useNativeDriver: true,
                    })
                ]).start();
            }
        };

        fetchProfile();
    }, []);

    const validateImage = async (uri: string) => {
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
            if (!fileInfo.exists) {
                throw new Error('Image file not found');
            }
            if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
                throw new Error('Image must be smaller than 5MB');
            }
        } catch (error) {
            console.error('Image validation failed:', error);
            throw error;
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'We need access to your photos to upload an avatar');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0].uri) {
                const compressedImage = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );
                await uploadImage(compressedImage.uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            setUploading(true);
            setAvatarLoading(true);
            setAvatarError(false);

            const networkState = await Network.getNetworkStateAsync();
            if (!networkState.isConnected) {
                throw new Error('No internet connection');
            }

            await validateImage(uri);

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw userError || new Error('No user logged in');

            const fileExt = uri.split('.').pop() || 'jpg';
            const fileName = `${user.id}-${uuidv4()}.${fileExt}`;
            const fileType = `image/${fileExt}`;

            const response = await fetch(uri);
            if (!response.ok) throw new Error('Failed to read image file');
            const blob = await response.blob();

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, blob, {
                    contentType: fileType,
                    upsert: true,
                    cacheControl: '3600'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setProfile(prev => ({
                ...prev,
                avatar_url: `${publicUrl.split('?')[0]}?ts=${Date.now()}`
            }));
            setRefreshKey(prev => prev + 1);

        } catch (error) {
            setAvatarError(true);
            console.error('Upload error:', error);
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to upload image'
            );
        } finally {
            setUploading(false);
            setAvatarLoading(false);
        }
    };

    const debouncedSave = useRef(
        debounce(async (profileData: UserProfile) => {
            try {
                setUploading(true);
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) throw userError || new Error('No user logged in');

                const { error } = await supabase
                    .from('profiles')
                    .update({
                        username: profileData.username,
                        address: profileData.address,
                        avatar_url: profileData.avatar_url?.split('?')[0],
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);

                if (error) throw error;

                navigation.navigate('Main', {
                    screen: 'Profile',
                    params: { refreshed: Date.now() }
                } as never);
                Alert.alert('Success', 'Profile updated successfully');
            } catch (error) {
                console.error('Save error:', error);
                Alert.alert(
                    'Error',
                    error instanceof Error ? error.message : 'Failed to save profile'
                );
            } finally {
                setUploading(false);
            }
        }, 500)
    ).current;

    const handleSave = () => {
        debouncedSave(profile);
    };

    useEffect(() => {
        return () => {
            debouncedSave.cancel();
        };
    }, [debouncedSave]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6a4baf" />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#f8f9fa', '#e9ecef']}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }]
                        }
                    ]}
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#6a4baf" />
                    </TouchableOpacity>

                    {/* Profile Picture Section */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={pickImage}
                            disabled={uploading}
                        >
                            <Image
                                key={`avatar-${refreshKey}`}
                                source={!avatarError && profile.avatar_url
                                    ? {
                                        uri: profile.avatar_url,
                                        cache: 'reload',
                                        headers: { Pragma: 'no-cache' }
                                    }
                                    : require('../../assets/images/default.png')}
                                style={styles.avatar}
                                onLoadStart={() => setAvatarLoading(true)}
                                onLoadEnd={() => setAvatarLoading(false)}
                                onError={() => setAvatarError(true)}
                            />
                            {avatarLoading && (
                                <ActivityIndicator
                                    style={styles.avatarLoadingOverlay}
                                    color="#6a4baf"
                                    size="large"
                                />
                            )}
                            <View style={styles.editAvatarButton}>
                                {uploading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <MaterialIcons name="camera-alt" size={24} color="#fff" />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="person" size={20} color="#6a4baf" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={profile.username}
                                    onChangeText={(text) => setProfile({ ...profile, username: text })}
                                    placeholder="Enter username"
                                    placeholderTextColor="#adb5bd"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="email" size={20} color="#6a4baf" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, styles.disabledInput]}
                                    value={profile.email}
                                    editable={false}
                                    placeholderTextColor="#adb5bd"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="location-on" size={20} color="#6a4baf" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, styles.multilineInput]}
                                    value={profile.address}
                                    onChangeText={(text) => setProfile({ ...profile, address: text })}
                                    placeholder="Enter address"
                                    multiline
                                    numberOfLines={3}
                                    placeholderTextColor="#adb5bd"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Profile</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    contentContainer: {
        paddingHorizontal: 25,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarSection: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        shadowColor: '#6a4baf',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: '#fff',
    },
    avatarLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 70,
    },
    editAvatarButton: {
        position: 'absolute',
        right: 5,
        bottom: 5,
        backgroundColor: '#6a4baf',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    formContainer: {
        marginTop: 20,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
        color: '#495057',
        fontWeight: '600',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#212529',
        paddingVertical: 15,
    },
    disabledInput: {
        color: '#868e96',
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    saveButton: {
        marginTop: 30,
        padding: 18,
        backgroundColor: '#6a4baf',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6a4baf',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 5,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});