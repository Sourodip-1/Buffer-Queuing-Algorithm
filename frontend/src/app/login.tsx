import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions, Animated, LayoutAnimation, UIManager, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authStep, setAuthStep] = useState<'PHONE' | 'LOADING' | 'OTP'>('PHONE');
  const { width } = useWindowDimensions();

  const otpHeight = useRef(new Animated.Value(0)).current;
  const otpOpacity = useRef(new Animated.Value(0)).current;
  const otpScale = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (authStep === 'PHONE') {
      if (phoneNumber.length < 10) return;
      setAuthStep('LOADING');

      setTimeout(() => {
        setAuthStep('OTP');

        // Explicitly animate the height of the OTP container to make the card grow smoothly
        Animated.parallel([
          Animated.timing(otpHeight, { toValue: 150, duration: 350, useNativeDriver: false }),
          Animated.timing(otpOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.stagger(100, otpScale.map(anim =>
            Animated.spring(anim, {
              toValue: 1,
              friction: 7,
              tension: 50,
              useNativeDriver: true,
            })
          ))
        ]).start();
      }, 1200);
    } else if (authStep === 'OTP') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/customer-dashboard' as any);
    }
  };

  const handleBack = () => {
    // Reverse the animation smoothly before switching the state back
    Animated.parallel([
      Animated.timing(otpHeight, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(otpOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ...otpScale.map(anim => Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }))
    ]).start(() => {
      setAuthStep('PHONE');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f4f7fb' }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', overflow: 'hidden' }}>
        <Image
          source={require('../../assets/images/login-backgound.png')}
          style={{ width: '128%', height: '100%', left: '-28%' }}
          contentFit="cover"
          contentPosition="bottom"
        />
        {/* Gradient to blend image into the background */}
        <LinearGradient
          colors={['rgba(244, 247, 251, 0)', '#f4f7fb']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
        />
      </View>

      <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'space-between' }}>

        {/* Top Section: Header & Hero Text */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Image
                source={require('../../assets/images/Buffer-logo.png')}
                style={{ width: 110, height: 36, marginLeft: -4 }}
                contentFit="contain"
                contentPosition="left"
              />
              <Text style={[styles.logoSubtitle, { marginTop: -1 }]}>Queues, made simple.</Text>
            </View>
          </View>

          {/* Hero Text */}
          <View style={{ marginTop: 40 }}>
            <Text style={styles.heroTitle}>
              Skip{'\n'}the wait,{'\n'}
              <Text style={{ color: '#0062ff' }}>not the{'\n'}moment.</Text>
            </Text>
            {/* <Text style={styles.heroSubtitle}>
              Join queues, track your turn,{'\n'}and save your time —{'\n'}anywhere, anytime.
            </Text> */}
          </View>
        </View>

        {/* Bottom Section: Login Card */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.bottomCard}>

            {/* Phone field — shows full input in PHONE/LOADING, compact row in OTP */}
            {authStep !== 'OTP' ? (
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color="#64748b" />
                </View>
                <View style={styles.divider} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter phone number"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={10}
                  editable={authStep === 'PHONE'}
                />
              </View>
            ) : (
              // Compact phone row in OTP step
              <View style={styles.compactPhoneRow}>
                <Text style={styles.compactPhoneText}>+91 {phoneNumber}</Text>
                <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* OTP boxes — animated height wrapper */}
            <Animated.View style={{ height: otpHeight, overflow: 'hidden', marginBottom: authStep === 'OTP' ? 16 : 0 }}>
              <Animated.View style={{ opacity: otpOpacity }}>
                {authStep === 'OTP' && (
                  <View style={{ paddingTop: 4 }}>
                    <Text style={styles.otpLabel}>Enter the 4-digit OTP</Text>
                    <View style={styles.otpBoxesContainer}>
                      {otpScale.map((anim, index) => (
                        <Animated.View
                          key={index}
                          style={[
                            styles.otpBox,
                            index === 0 && styles.otpBoxFocused,
                            { transform: [{ scale: anim }] }
                          ]}
                        />
                      ))}
                    </View>
                    <View style={styles.otpSentRow}>
                      <Text style={styles.otpSentText}>OTP sent to +91 {phoneNumber}</Text>
                      <TouchableOpacity>
                        <Text style={styles.resendText}>Resend in 30s</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            </Animated.View>

            {/* Primary button — changes label per step */}
            <TouchableOpacity
              style={[styles.continueButton, authStep === 'LOADING' && { backgroundColor: '#93c5fd' }]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={authStep === 'LOADING'}
            >
              {authStep === 'LOADING' ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.continueButtonText}>Sending OTP...</Text>
                </>
              ) : authStep === 'OTP' ? (
                <>
                  <Text style={styles.continueButtonText}>Verify &amp; Login</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                </>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Continue with Phone</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider + Features — always visible */}
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>and</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(224,231,255,0.8)' }]}>
                  <MaterialIcons name="access-time" size={22} color="#3B82F6" />
                </View>
                <Text style={styles.featureTitle}>Save Time</Text>
                <Text style={styles.featureDesc}>Join queues{' '}remotely</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(243,232,255,0.8)' }]}>
                  <MaterialIcons name="notifications-active" size={22} color="#9333ea" />
                </View>
                <Text style={styles.featureTitle}>Stay Notified</Text>
                <Text style={styles.featureDesc}>Get real-time{' '}updates</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(220,252,231,0.8)' }]}>
                  <MaterialIcons name="location-on" size={22} color="#16a34a" />
                </View>
                <Text style={styles.featureTitle}>Everywhere</Text>
                <Text style={styles.featureDesc}>Cafes, colleges, banks and more</Text>
              </View>
            </View>

          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 44,
    letterSpacing: -1,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#475569',
    marginTop: 12,
    lineHeight: 22,
    fontWeight: '500',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  bottomCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    height: 56,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  phoneInputCompact: {
    height: 48,
    justifyContent: 'center',
    marginBottom: 8,
  },
  compactPhoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 12,
    marginBottom: 4,
  },
  compactPhoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  otpSentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  continueButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  orText: {
    color: '#94a3b8',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#0062ff',
  },
  otpLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 16,
    marginLeft: 4,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpBox: {
    width: '21%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  otpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  otpSentText: {
    fontSize: 12,
    color: '#64748b',
  },
  resendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
});
