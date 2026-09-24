import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const { width } = useWindowDimensions();

  const handleLogin = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/customer-dashboard' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f4f7fb' }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', overflow: 'hidden' }}>
        <Image
          source={require('../../assets/images/login-backgound.png')}
          style={{ width: '115%', height: '100%', left: '-15%' }}
          contentFit="cover"
          contentPosition="bottom"
        />
        {/* Gradient to blend image into the background */}
        <LinearGradient
          colors={['rgba(244, 247, 251, 0)', '#f4f7fb']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
        />
      </View>

      <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }}>

        {/* Top Section: Header & Hero Text */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../assets/images/buffer-logo.svg')}
                style={{ width: 44, height: 44 }}
                contentFit="contain"
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.logoTitle}>Buffer</Text>
                <Text style={styles.logoSubtitle}>Queues, made simple.</Text>
              </View>
            </View>
          </View>

          {/* Hero Text */}
          <View style={{ marginTop: 40 }}>
            <Text style={styles.heroTitle}>
              Skip{'\n'}the wait,{'\n'}
              <Text style={{ color: '#0062ff' }}>not the{'\n'}moment.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Join queues, track your turn,{'\n'}and save your time —{'\n'}anywhere, anytime.
            </Text>
          </View>
        </View>

        {/* Bottom Section: Login Card */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.bottomCard}>

            {/* Phone Login */}
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
              />
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.continueButtonText}>Continue with Phone</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>

            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(224,231,255,0.8)' }]}>
                  <MaterialIcons name="access-time" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.featureTitle}>Save Time</Text>
                <Text style={styles.featureDesc}>Join queues{'\n'}remotely</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(243,232,255,0.8)' }]}>
                  <MaterialIcons name="notifications-active" size={24} color="#9333ea" />
                </View>
                <Text style={styles.featureTitle}>Stay Notified</Text>
                <Text style={styles.featureDesc}>Get real-time{'\n'}updates</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(220,252,231,0.8)' }]}>
                  <MaterialIcons name="location-on" size={24} color="#16a34a" />
                </View>
                <Text style={styles.featureTitle}>Everywhere</Text>
                <Text style={styles.featureDesc}>Cafes, colleges,{'\n'}banks</Text>
              </View>
            </View>

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
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
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#475569',
    marginTop: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
  bottomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
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
});
