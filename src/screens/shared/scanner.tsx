    import { useNavigation } from '@react-navigation/native';
    import { NativeStackNavigationProp } from '@react-navigation/native-stack';
    import {
        CameraView,
        CameraType,
        useCameraPermissions,
        BarcodeScanningResult,
        BarcodeType,
    } from 'expo-camera';
    import { useState, useRef, useEffect } from 'react';
    import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
    import { MaterialIcons } from '@expo/vector-icons';
    import { createClient } from '@supabase/supabase-js';
    import { CameraOverlay } from '../components/CameraOverlay';

    type RootStackParamList = {
        ResultScreen: { productData: any };
        // Add other screens and their params here if needed
    };

    const SCAN_TIMEOUT = 5000;
    const SUPPORTED_BARCODE_TYPES: BarcodeType[] = [
        'aztec',
        'ean13',
        'ean8',
        'qr',
        'pdf417',
        'upc_e',
        'datamatrix',
        'code39',
        'code93',
        'itf14',
        'codabar',
        'code128',
        'upc_a',
    ];

    const supabaseUrl = 'https://mybjttehecduzulururb.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Ymp0dGVoZWNkdXp1bHVydXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTEyMzEsImV4cCI6MjA2ODEyNzIzMX0.JxyU7I54qAWoQBillFtpm-GaMzAaDc3oPj9iZUQwd08';
    const supabase = createClient(supabaseUrl, supabaseKey);

    export default function App() {
        const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
        const [facing, setFacing] = useState<CameraType>('back');
        const [permission, requestPermission] = useCameraPermissions();
        const [torchEnabled, setTorchEnabled] = useState(false);
        const [isScanning, setIsScanning] = useState(false);
        const [scanStatus, setScanStatus] = useState('Press Icon to Scan');
        const timeoutRef = useRef<NodeJS.Timeout | null>(null);
        const [cameraKey, setCameraKey] = useState(0);

        // Reset function
        const resetScanner = () => {
            setIsScanning(false);
            setScanStatus('Press Icon to Scan');
            setFacing('back');
            setTorchEnabled(false);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setCameraKey(prevKey => prevKey + 1);
        };

        // Reset when screen comes into focus
        useEffect(() => {
            const unsubscribe = navigation.addListener('focus', resetScanner);
            return unsubscribe;
        }, [navigation]);

        const startScanTimeout = () => {
            timeoutRef.current = setTimeout(() => {
                setIsScanning(false);
                setScanStatus('Scan timed out');
                Alert.alert('Scan Timeout', 'No barcode detected after 5 seconds.', [
                    { text: 'OK', onPress: () => setScanStatus('Press Icon to Scan') },
                ]);
            }, SCAN_TIMEOUT);
        };

        const handleScanButtonPress = () => {
            setIsScanning(true);
            setScanStatus('Scanning...');
            startScanTimeout();
        };

        const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
            if (!isScanning || !result?.data) return;  // Check if result or result.data is undefined

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            if (!SUPPORTED_BARCODE_TYPES.includes(result.type as BarcodeType)) {
                setIsScanning(false);
                setScanStatus('Unsupported barcode');
                Alert.alert('Unsupported Barcode', `Type: ${result.type}`, [
                    { text: 'OK', onPress: () => setScanStatus('Press Icon to Scan') },
                ]);
                return;
            }

            setIsScanning(false);
            setScanStatus('Barcode scanned');

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('barcode', result.data)
                .single();

            if (error) {
                Alert.alert('Error', 'Failed to fetch product details');
                console.error('Supabase error:', error);
                return;
            }

            navigation.navigate('ResultScreen', { productData: data });
        };

        const toggleCameraFacing = () => {
            setFacing(current => (current === 'back' ? 'front' : 'back'));
        };

        const toggleTorch = () => {
            setTorchEnabled(current => !current);
        };

        const handleBackPress = () => {
            navigation.goBack();
        };

        if (!permission) return <View />;
        if (!permission.granted) {
            return (
                <View style={styles.container}>
                    <Text style={styles.scanText}>We need camera permission</Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.iconButton}>
                        <Text style={styles.scanButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.container}>
                <CameraView
                    key={`camera-${cameraKey}`}
                    style={styles.camera}
                    facing={facing}
                    enableTorch={torchEnabled}
                    barcodeScannerSettings={{
                        barcodeTypes: SUPPORTED_BARCODE_TYPES,
                    }}
                    onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackPress}
                    >
                        <MaterialIcons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>

                    <CameraOverlay
                        scanStatus={scanStatus}
                        isScanning={isScanning}
                        onScanPress={handleScanButtonPress}
                        onTorchPress={toggleTorch}
                        onFlipPress={toggleCameraFacing}
                        torchEnabled={torchEnabled}
                    />

                    <TouchableOpacity
                        style={[styles.scanIconButton, isScanning && styles.scanButtonDisabled]}
                        onPress={handleScanButtonPress}
                        disabled={isScanning}
                    >
                        <MaterialIcons name="qr-code-scanner" size={36} color="white" />
                    </TouchableOpacity>
                </CameraView>
            </View>
        );
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
        },
        camera: {
            flex: 1,
        },
        backButton: {
            position: 'absolute',
            top: 50,
            left: 20,
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: 50,
            width: 50,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
        },
        scanText: {
            position: 'absolute',
            top: '20%',
            alignSelf: 'center',
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 10,
            borderRadius: 5,
        },
        topButtonContainer: {
            position: 'absolute',
            top: 50,
            right: 20,
            flexDirection: 'row',
            gap: 15,
        },
        iconButton: {
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: 50,
            width: 50,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
        },
        scanIconButton: {
            position: 'absolute',
            top: '75%',
            alignSelf: 'center',
            backgroundColor: '#007AFF',
            padding: 20,
            borderRadius: 50,
        },
        scanButtonDisabled: {
            backgroundColor: '#AAAAAA',
        },
        scanButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
        },
    });