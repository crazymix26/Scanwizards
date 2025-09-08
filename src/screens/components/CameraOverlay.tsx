import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Text, 
  Animated, 
  Easing  // Added Easing import here
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

interface CameraOverlayProps {
    scanStatus: string;
    isScanning: boolean;
    onScanPress: () => void;
    onTorchPress: () => void;
    onFlipPress: () => void;
    torchEnabled: boolean;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
    scanStatus,
    isScanning,
    onScanPress,
    onTorchPress,
    onFlipPress,
    torchEnabled,
}) => {
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const frameSize = width * 0.7;
    const scanLineHeight = 4;

    useEffect(() => {
        startScanLineAnimation();
    }, []);

    const startScanLineAnimation = () => {
        scanLineAnim.setValue(0);
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,  // Fixed: Using Easing directly
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.linear,  // Fixed: Using Easing directly
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    return (
        <>
            {/* Top buttons */}
            <View style={styles.topButtonContainer}>
                <TouchableOpacity style={styles.iconButton} onPress={onTorchPress}>
                    <MaterialIcons
                        name={torchEnabled ? 'flash-on' : 'flash-off'}
                        size={28}
                        color="white"
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={onFlipPress}>
                    <MaterialIcons name="flip-camera-ios" size={28} color="white" />
                </TouchableOpacity>
            </View>

            {/* Scan frame with animated line */}
            <View style={styles.scanFrameContainer}>
                <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                    
                    <Animated.View
                        style={[
                            styles.scanLine,
                            {
                                transform: [{
                                    translateY: scanLineAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, frameSize - scanLineHeight],
                                    }),
                                }],
                            }
                        ]}
                    />
                </View>
            </View>

            {/* Status text */}
            <View style={styles.statusContainer}>
                <Text style={styles.scanText}>{scanStatus}</Text>
            </View>
        </>
    );
};

// ... (keep the same styles as before)

const styles = StyleSheet.create({
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
    scanFrameContainer: {
        position: 'absolute',
        top: '30%',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: width * 0.7,
        height: width * 0.7,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 1)',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 10,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#0fe0ebff',
    },
    topLeft: {
        top: -2,
        left: -2,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 10,
    },
    topRight: {
        top: -2,
        right: -2,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 10,
    },
    bottomLeft: {
        bottom: -2,
        left: -2,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 10,
    },
    bottomRight: {
        bottom: -2,
        right: -2,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 10,
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 4,
        backgroundColor: '#0fe0ebff',
        borderRadius: 2,
    },
    statusContainer: {
        position: 'absolute',
        top: '25%',
        alignSelf: 'center',
    },
    scanText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 5,
    },
    scanIconButton: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: '#007AFF',
        padding: 20,
        borderRadius: 50,
    },
    scanButtonDisabled: {
        backgroundColor: '#AAAAAA',
    },
});