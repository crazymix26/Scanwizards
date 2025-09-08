import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';

// Define profile type
type Profile = {
    id: string;
    full_name: string;
    avatar_url?: string;
    role?: string; // Add role property
    [key: string]: any;
};

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    userRole: string | null; // Add userRole
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    userRole: null, // Add default
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null); // Add state

    useEffect(() => {
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setSession(session);
                setUser(session.user);
                await fetchUserProfile(session.user.id);
            }
            setIsLoading(false);
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                setSession(session);
                setUser(session.user);
                await fetchUserProfile(session.user.id);
            } else {
                setSession(null);
                setUser(null);
                setProfile(null);
                setUserRole(null); // Reset role
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error loading profile:', error.message);
            Alert.alert('Profile Error', error.message);
        }

        if (data) {
            setProfile(data);
            setUserRole(data.role ?? null); // Set userRole from profile
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, isLoading, userRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
