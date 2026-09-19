import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Modal,
  Button,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput as PaperInput, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '../theme/theme';
import { validateQueueCode, QueueVenue, MOCK_VENUES } from '../services/mockQueueData';

export default function ScanQRScreen() {
  const router = useRouter();

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  // Camera & utility states
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [lens, setLens] = useState<'back' | 'front'>('back');

  // Manual code input & validation state
  const [queueCode, setQueueCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detected venue state
  const [detectedVenue, setDetectedVenue] = useState<QueueVenue | null>(null);
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  // Prevent multiple rapid scans
  const scannedRef = useRef(false);

  // Animated vertical laser
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [laserAnim]);

  // Flashlight toggle
  const toggleTorch = () => {
    setIsTorchOn((prev) => !prev);
  };

  // Flip lens toggle
  const toggleLens = () => {
    setLens((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Gallery simulation
  const handleUploadImage = () => {
    Alert.alert(
      'Upload QR Image',
      'Scan a saved QR code image from your library:',
      [
        {
          text: 'Blue Bean Cafe QR',
          onPress: () => setDetectedVenue(MOCK_VENUES['BBC-402']),
        },
        {
          text: 'Invalid Photo',
          onPress: () => Alert.alert('Error', 'No valid Buffer QR code found.'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Tap viewfinder to simulate instant scan
  const handleTapViewfinder = () => {
    setDetectedVenue(MOCK_VENUES['BBC-402']);
  };

  // Reusable validation logic
  const validateCode = async (code: string) => {
    setErrorMessage(null);
    if (!code.trim()) {
      setErrorMessage('Please enter a queue code.');
      scannedRef.current = false;
      return;
    }

    setIsLoading(true);
    try {
      const result = await validateQueueCode(code);
      if (result.success && result.venue) {
        router.push({
          pathname: '/scan-result',
          params: {
            queueCode: result.venue.code,
            venueName: result.venue.name,
            serviceName: result.venue.service,
          },
        } as any);
      } else {
        setErrorMessage(result.error || 'Invalid queue code.');
        // Allow scanning again after a delay if failed
        setTimeout(() => { scannedRef.current = false; }, 2000);
      }
    } catch {
      setErrorMessage('Verification failed. Try again.');
      setTimeout(() => { scannedRef.current = false; }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Camera scanned callback
  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scannedRef.current || isLoading) return;
    scannedRef.current = true;
    setQueueCode(data);
    validateCode(data);
  };

  // Manual code submit
  const handleContinueWithCode = async () => {
    validateCode(queueCode);
  };

  const handleJoinDetected = () => {
    if (!detectedVenue) return;
    router.push({
      pathname: '/scan-result',
      params: {
        queueCode: detectedVenue.code,
        venueName: detectedVenue.name,
        serviceName: detectedVenue.service,
      },
    } as any);
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 224],
  });

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.container}>
          <Text style={{ textAlign: 'center', marginBottom: 20, color: theme.colors.onSurface }}>
            We need your permission to show the camera
          </Text>
          <Button onPress={requestPermission} title="Grant Permission" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerButton} />

        <Text style={styles.headerTitle}>Scan QR</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setIsHelpVisible(true)}
          accessibilityLabel="Help"
        >
          <MaterialIcons name="help-outline" size={22} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Concise Header */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Scan to Join</Text>
          <Text style={styles.subtitle}>Point your camera at a Buffer QR code</Text>
        </View>

        {/* Viewfinder Area */}
        <View style={styles.viewfinderWrapper}>
          <View style={[styles.viewfinder, isTorchOn && styles.viewfinderTorch]}>
            <CameraView 
              style={StyleSheet.absoluteFill}
              facing={lens}
              enableTorch={isTorchOn}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            {/* Corner guides */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Laser line */}
            <Animated.View
              style={[
                styles.laserLine,
                { transform: [{ translateY: laserTranslateY }] },
              ]}
            />
          </View>
        </View>

        <Text style={styles.alignHint}>Align QR code within frame</Text>

        {/* 3 Essential Utilities */}
        <View style={styles.controlsRow}>
          <View style={styles.controlCol}>
            <TouchableOpacity
              style={[styles.controlBtn, isTorchOn && styles.controlBtnActive]}
              onPress={toggleTorch}
            >
              <MaterialIcons
                name={isTorchOn ? 'flash-off' : 'flash-on'}
                size={24}
                color={isTorchOn ? theme.colors.onPrimary : theme.colors.onSurface}
              />
            </TouchableOpacity>
            <Text style={styles.controlText}>{isTorchOn ? 'Light On' : 'Flashlight'}</Text>
          </View>

          <View style={styles.controlCol}>
            <TouchableOpacity style={styles.controlBtn} onPress={handleUploadImage}>
              <MaterialIcons name="photo-library" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.controlText}>Upload image</Text>
          </View>

          <View style={styles.controlCol}>
            <TouchableOpacity style={styles.controlBtn} onPress={toggleLens}>
              <MaterialIcons name="flip-camera-ios" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.controlText}>{lens === 'back' ? 'Back lens' : 'Front lens'}</Text>
          </View>
        </View>

        {/* Detected QR Toast */}
        {detectedVenue && (
          <View style={styles.detectedToast}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detectedTitle}>{detectedVenue.name}</Text>
              <Text style={styles.detectedSubtitle}>
                Est. wait: {detectedVenue.estimatedWaitMinutes}m · {detectedVenue.waitingPatrons} ahead
              </Text>
            </View>
            <TouchableOpacity style={styles.joinButton} onPress={handleJoinDetected}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Manual Code Input Card */}
        <View style={styles.manualCard}>
          <PaperInput
            mode="outlined"
            label="Have a queue code?"
            placeholder="e.g. BBC-402"
            value={queueCode}
            textColor={theme.colors.onSurface}
            theme={{ colors: { error: '#ff3333' } }}
            onChangeText={(text) => {
              setQueueCode(text.toUpperCase());
              if (errorMessage) setErrorMessage(null);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={10}
            disabled={isLoading}
            error={!!errorMessage}
            onSubmitEditing={handleContinueWithCode}
            right={
              queueCode.length > 0 && !isLoading ? (
                <PaperInput.Icon
                  icon="close"
                  onPress={() => {
                    setQueueCode('');
                    setErrorMessage(null);
                  }}
                />
              ) : null
            }
            outlineColor={theme.colors.outlineVariant}
            activeOutlineColor={theme.colors.primary}
            style={{ backgroundColor: theme.colors.surfaceContainerLowest }}
          />
          <HelperText type="error" visible={!!errorMessage} style={{ paddingHorizontal: 0 }}>
            {errorMessage}
          </HelperText>

          <TouchableOpacity
            style={[styles.continueBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleContinueWithCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.continueBtnText}>Continue</Text>
                <MaterialIcons name="arrow-forward" size={18} color={theme.colors.onPrimary} />
              </>
            )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Clean Help Modal */}
      <Modal
        visible={isHelpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsHelpVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>How to Join</Text>
            <Text style={styles.modalText}>
              Scan the Buffer QR code at the venue or type the queue code to join the line and reserve your spot.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setIsHelpVisible(false)}
            >
              <Text style={styles.modalBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerHigh,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },

  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 110,
    alignItems: 'center',
  },

  titleSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },

  viewfinderWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderRadius: 24,
    backgroundColor: '#0c1017',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  viewfinderTorch: {
    borderWidth: 2,
    borderColor: '#FBC02D',
  },

  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: theme.colors.primaryContainer,
  },
  topLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 12,
    right: 12,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },

  laserLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2.5,
    backgroundColor: '#42A5F5',
    borderRadius: 2,
    shadowColor: '#42A5F5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  centerTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToScanHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },

  alignHint: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 10,
    marginBottom: theme.spacing.sm,
  },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 320,
    marginVertical: theme.spacing.sm,
  },
  controlCol: {
    alignItems: 'center',
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  controlText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 6,
    fontWeight: '500',
  },

  detectedToast: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.sm,
  },
  detectedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.onSecondaryContainer,
  },
  detectedSubtitle: {
    fontSize: 11,
    color: theme.colors.onSecondaryContainer,
    opacity: 0.85,
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },

  manualCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 18,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
    letterSpacing: 1.5,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 11,
    marginTop: 6,
    marginLeft: 2,
  },
  continueBtn: {
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
});
