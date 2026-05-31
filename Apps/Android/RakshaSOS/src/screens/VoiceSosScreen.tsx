import { Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Mic,
  VolumeX,
  Radio,
  FileText,
  Shield,
  Square
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function VoiceSosScreen({ navigation }: any) {
  const [isRecording, setIsRecording] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnims] = useState([
    new Animated.Value(15),
    new Animated.Value(30),
    new Animated.Value(10),
    new Animated.Value(45),
    new Animated.Value(20),
    new Animated.Value(5),
  ]);

  // Pulse animation for recording microphone
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 1200,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => animation?.stop();
  }, [isRecording]);

  // Simulating live audio waves
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        waveAnims.forEach(anim => {
          Animated.timing(anim, {
            toValue: Math.random() * 50 + 10,
            duration: 150,
            useNativeDriver: false,
          }).start();
        });
      }, 180);
    } else {
      waveAnims.forEach(anim => anim.setValue(8));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStopRecording = () => {
    setIsRecording(false);
    Alert.alert(
      "Broadcasting Paused",
      "Your audio broadcast has been saved locally and sent to the cloud emergency vault.",
      [{ text: "OK" }]
    );
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ac2b2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice SOS Broadcast</Text>   
        <Radio size={22} color={isRecording ? "#ac2b2e" : "#555"} />  
      </View>

      <View style={styles.content}>
        {/* Active Signal Status */}
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, isRecording && styles.statusDotActive]} />
          <Text style={styles.statusLabel}>
            {isRecording ? "TRANSMITTING LIVE AUDIO" : "BROADCAST ENDED"}
          </Text>
        </View>

        <Text style={styles.instruction}>
          {isRecording
            ? "Your phone's microphone is active. We are streaming ambient sounds to your guardians and transcribing voice keywords for emergency responder matching."
            : "Broadcast saved. Tap below to resume audio streaming."}
        </Text>

        {/* Pulse Mic Container */}
        <View style={styles.micContainer}>
          {isRecording && (
            <Animated.View
              style={[
                styles.pulseCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
          )}
          <View style={[styles.micMain, !isRecording && styles.micMainInactive]}>
            <Mic size={54} color="#FFF" />
          </View>
        </View>

        {/* Live Audio Soundwaves */}
        <View style={styles.waveContainer}>
          {waveAnims.map((anim, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.waveBar,
                { height: anim },
                !isRecording && styles.waveBarInactive,
              ]}
            />
          ))}
        </View>

        {/* Real-time Transcription mockup */}
        <View style={styles.transcriptionCard}>
          <View style={styles.cardHeader}>
            <FileText size={16} color="#ac2b2e" />
            <Text style={styles.cardHeaderTitle}>Live Transcription Vault</Text>
          </View>
          <Text style={styles.transcriptText}>
            {isRecording
              ? '"[00:04] Help... near Market Road... please send assistance immediately..."'
              : '"[00:12] Broadcast Terminated. Transcription locked and encrypted."'}
          </Text>
          <View style={styles.securityBadge}>
            <Shield size={12} color="#346645" />
            <Text style={styles.securityBadgeText}>AES-256 Encrypted Tunnel</Text>
          </View>
        </View>

        {/* Control Button */}
        {isRecording ? (
          <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
            <Square size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.stopButtonText}>STOP & ENCRYPT BROADCAST</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleStartRecording}>
            <Mic size={20} color="#FFF" style={{ marginRight: 8 }} /> 
            <Text style={styles.startButtonText}>RESUME VOICE SOS</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0bfbc',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#777',
  },
  statusDotActive: {
    backgroundColor: '#ac2b2e',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a1c1b',
    letterSpacing: 0.5,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 14,
    color: '#59413f',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  micContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
    height: 200,
  },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ffdad6',
  },
  micMain: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ac2b2e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ac2b2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  micMainInactive: {
    backgroundColor: '#59413f',
    shadowColor: '#59413f',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 60,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#ac2b2e',
    borderRadius: 3,
  },
  waveBarInactive: {
    backgroundColor: '#e0bfbc',
  },
  transcriptionCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  transcriptText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#59413f',
    lineHeight: 20,
    marginBottom: 12,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#f5fff3',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  securityBadgeText: {
    fontSize: 10,
    color: '#346645',
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#ac2b2e',
    width: '100%',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  startButton: {
    backgroundColor: '#4e5f7e',
    width: '100%',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
