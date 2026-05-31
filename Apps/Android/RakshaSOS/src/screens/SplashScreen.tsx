import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { auth } from '../config/firebaseconfig';

export default function SplashScreen({ navigation }: { navigation: any }) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { t } = useApp();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (auth.currentUser) {
        navigation.replace('MainTabs');
      } else {
        navigation.replace('Signup');
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [navigation, opacity, scale]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.alertRing} />
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logo}>
          <Ionicons name="shield-checkmark" size={46} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{t('appName')}</Text>
        <Text style={styles.subtitle}>{t('tagline')}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.signalDot} />
        <Text style={styles.footerText}>Safety network initializing</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  alertRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 28,
    borderColor: colors.primarySoft,
  },
  logoWrap: {
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  title: {
    color: colors.ink,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    maxWidth: 260,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  footerText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
