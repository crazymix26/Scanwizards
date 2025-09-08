//navigation.ts
import { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
    Startup: undefined;
    ResultScreen: { product: any };
    ProfileScreen: { refreshed?: number };
    Login: undefined;
    Signup: undefined;
    MapScreen: { storeData: any[]; userLocation: any };
    Main: undefined;
    EditProfile: undefined;  // Explicitly define Admin route
    StoreOwner: NavigatorScreenParams<StoreOwnerStackParamList>;
    Admin: undefined;
    AdminSetup: undefined;

} & StoreOwnerStackParamList & AdminStackParamList;

export type HomeStackParamList = {
    HomeMain: undefined;
    Scanner: undefined;
    AddProduct: undefined;
    AddStore: undefined;
    MyShop: undefined;
    ResultScreen: { product: any };
    MapScreen: { storeData: any[]; userLocation: any };
    StoreOwner: undefined;
    StoreProducts: { storeId: string };
    CreateStore: undefined;
    StoreDetails: undefined;
};

export type TabParamList = {
    Home: undefined;
    Search: undefined;
    Profile: { refreshed?: number };
};

export type StoreOwnerStackParamList = {
    MyShop: undefined;
    AddProduct: undefined;
    AssignProducts: { storeId: number };
    CreateStore: undefined;
    MyStores: undefined;
    StoreDetails: { storeId: number };
    ManageProduct: { storeId: string };

};

export type AdminStackParamList = {
    AdminDashboard: undefined;
    Approvals: undefined;
    AdminSetup: undefined;
    AllStores: undefined;

};