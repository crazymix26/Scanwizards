// App.tsx

import React from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RootStackParamList, HomeStackParamList, TabParamList, StoreOwnerStackParamList, AdminStackParamList } from './src/types/navigation';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import HomeScreen from './src/screens/shared/HomeScreen';
import ScannerScreen from './src/screens/shared/scanner';
import SearchScreen from './src/screens/shared/SearchScreen';
import ProfileScreen from './src/screens/shared/ProfileScreen';
import ProfileEditScreen from './src/screens/shared/ProfileEditScreen';
import StartupScreen from './src/screens/auth/Startup';
import AddProductScreen from './src/screens/storeowner/AddProductScreen';
import ResultScreen from './src/screens/components/ResultScreen';
import MapScreen from './src/screens/components/Maps';
import MyShopScreen from './src/screens/storeowner/MyShopScreen';
import AssignProductsScreen from './src/screens/storeowner/AssignProductsScreen';
import AdminApprovalScreen from './src/screens/admin/AdminApprovalScreen';
import AdminDashboard from './src/screens/admin/AdminDashboard';
import AdminSetupScreen from './src/screens/admin/AdminSetupScreen';
import CreateStoreScreen from './src/screens/storeowner/CreateStroreScreen'; 
import MyStoresScreen from './src/screens/storeowner/MyStoresScreen';
import StoreDetailsScreen from './src/screens/storeowner/StoreDetailsScreen';
import AllStoresScreen from './src/screens/admin/AllStoreScreen';
import ManageProductScreen from './src/screens/storeowner/ManageProductScreen';

// Create navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const StoreOwnerStack = createNativeStackNavigator<StoreOwnerStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();


// Store Owner Stack
function StoreOwnerStackScreen() {
  return (
    <StoreOwnerStack.Navigator screenOptions={{ headerShown: false }}>
      <StoreOwnerStack.Screen name="MyShop" component={MyShopScreen} />
      <StoreOwnerStack.Screen name="AddProduct" component={AddProductScreen} />
      <StoreOwnerStack.Screen name="CreateStore" component={CreateStoreScreen} />
      <StoreOwnerStack.Screen name="MyStores" component={MyStoresScreen} />
      <StoreOwnerStack.Screen name="StoreDetails" component={StoreDetailsScreen} />
      <StoreOwnerStack.Screen name="AssignProducts" component={AssignProductsScreen} />
      <StoreOwnerStack.Screen name="ManageProduct" component={ManageProductScreen} />
    </StoreOwnerStack.Navigator>
  );
}

// Home Stack
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Scanner" component={ScannerScreen} />
      <HomeStack.Screen name="ResultScreen" component={ResultScreen} />
      <HomeStack.Screen name="StoreOwner" component={StoreOwnerStackScreen} />
      <HomeStack.Screen name="MapScreen" component={MapScreen} />
      <HomeStack.Screen name="StoreDetails" component={StoreDetailsScreen} />


    </HomeStack.Navigator>
  );
}

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? '';
        const hideOnScreens = ['Scanner', 'StoreOwner', 'ResultScreen', 'MapScreen'];

        return {
          headerShown: false,
          tabBarStyle: hideOnScreens.includes(routeName) ? { display: 'none' } : undefined,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            if (route.name === 'Home') iconName = 'home-outline';
            else if (route.name === 'Search') iconName = 'search-outline';
            else iconName = 'person-outline';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const { session, userRole } = useAuth();

  return (
    <RootStack.Navigator
      initialRouteName="Startup"
      screenOptions={{ headerShown: false }}
    >
      {!session ? (
        <>
          <RootStack.Screen name="Startup" component={StartupScreen} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        <>
          <RootStack.Screen name="Main" component={TabNavigator} />
          <RootStack.Screen name="EditProfile" component={ProfileEditScreen} />
          <RootStack.Screen name="StoreOwner" component={StoreOwnerStackScreen} />
          <RootStack.Screen name="ResultScreen" component={ResultScreen} />
          <RootStack.Screen name="MapScreen" component={MapScreen} />
            <RootStack.Screen name="AdminDashboard" component={AdminDashboard} />
            <RootStack.Screen name="Approvals" component={AdminApprovalScreen} />
            <RootStack.Screen name="AdminSetup" component={AdminSetupScreen} />
            <RootStack.Screen name="AllStores" component={AllStoresScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}

function AdminStackScreen() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboard} />
      <AdminStack.Screen name="Approvals" component={AdminApprovalScreen} />
    </AdminStack.Navigator>
  );
}


// App Entry Point
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}