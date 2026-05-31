import { Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Shield,
  Volume2,
  PhoneCall,
  Share2,
  Users,
  MapPin,
  CheckCircle,
  AlertOctagon
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function WomenSafetyScreen({ navigation }: any) {      
  const [sirenActive, setSirenActive] = useState(false);
  const [fakeCallActive, setFakeCallActive] = useState(false);        
  const [fakeCallTimer, setFakeCallTimer] = useState<any>(null);      
  const [alertSent, setAlertSent] = useState(false);

  // Siren pulse animation effect / Vibration
  useEffect(() => {
    let interval: any;
    if (sirenActive) {
      interval = setInterval(() => {
        Vibration.vibrate([100, 200, 100, 200], true);
      }, 1000);
    } else {
      Vibration.cancel();
    }
    return () => {
      clearInterval(interval);
      Vibration.cancel();
    };
  }, [sirenActive]);

  // Fake Call simulation trigger
  const triggerFakeCall = () => {
    Alert.alert(
      "Fake Call Scheduled",
      "A simulated incoming call will trigger in 3 seconds to help you exit your current situation.",
      [{ text: "OK" }]
    );
    const timer = setTimeout(() => {
      setFakeCallActive(true);
    }, 3000);
    setFakeCallTimer(timer);
  };

  const cancelFakeCall = () => {
    if (fakeCallTimer) clearTimeout(fakeCallTimer);
    setFakeCallActive(false);
  };

  const handleSendAlert = () => {
    setAlertSent(true);
    Alert.alert(
      "Safety Alert Sent",
      "Your live location, audio, and emergency details have been broadcasted to all guardian contacts and nearest PCR vehicles.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ac2b2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Women Safety Zone</Text>     
        <Shield size={24} color="#ac2b2e" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.alertBanner}>
          <AlertOctagon size={24} color="#ac2b2e" />
          <Text style={styles.bannerText}>
            Instantly trigger alarms, track safety paths, or request immediate escorts.
          </Text>
        </View>

        {/* Primary SOS Alert Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSendAlert}
          style={[styles.alertButton, alertSent && styles.alertButtonActive]}
        >
          <View style={styles.alertInnerCircle}>
            <Share2 size={36} color="#FFF" />
            <Text style={styles.alertButtonText}>
              {alertSent ? "ALERT ACTIVE" : "BROADCAST LOCATION"}     
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tools Section */}
        <Text style={styles.sectionTitle}>Safety Intervention Tools</Text>
        <View style={styles.toolsGrid}>
          {/* Siren Alarm */}
          <TouchableOpacity
            style={[styles.toolCard, sirenActive && styles.toolCardActive]}
            onPress={() => setSirenActive(!sirenActive)}
          >
            <Volume2 size={32} color={sirenActive ? "#FFF" : "#ac2b2e"} />
            <Text style={[styles.toolTitle, sirenActive && styles.toolTextActive]}>
              {sirenActive ? "Stop Siren" : "Siren Alarm"}
            </Text>
            <Text style={[styles.toolDesc, sirenActive && styles.toolDescActive]}>
              Plays high-volume warning alarm
            </Text>
          </TouchableOpacity>

          {/* Fake Call */}
          <TouchableOpacity style={styles.toolCard} onPress={triggerFakeCall}>
            <PhoneCall size={32} color="#ac2b2e" />
            <Text style={styles.toolTitle}>Fake Call</Text>
            <Text style={styles.toolDesc}>
              Simulate an urgent call to leave
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contacts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Safety Contacts</Text>
          <TouchableOpacity style={styles.addContactButton}>
            <Users size={16} color="#ac2b2e" />
            <Text style={styles.addContactText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactsCard}>
          <View style={styles.contactItem}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Mom</Text>
              <Text style={styles.contactPhone}>+91 98765 43210</Text>
            </View>
            <View style={styles.statusRow}>
              <CheckCircle size={14} color="#346645" />
              <Text style={styles.statusText}>Receiving Live GPS</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Dad</Text>
              <Text style={styles.contactPhone}>+91 98765 43211</Text>
            </View>
            <View style={styles.statusRow}>
              <CheckCircle size={14} color="#346645" />
              <Text style={styles.statusText}>Receiving Live GPS</Text>
            </View>
          </View>
        </View>

        {/* Nearby Safety Hubs */}
        <Text style={styles.sectionTitle}>Safety Shelters & PCRs Nearby</Text>
        <View style={styles.shelterCard}>
          <View style={styles.shelterHeader}>
            <MapPin size={18} color="#ac2b2e" />
            <Text style={styles.shelterName}>PCR Vehicle #12 (Active Patrol)</Text>
          </View>
          <Text style={styles.shelterDetails}>Distance: 450m • Moving towards North Avenue</Text>
          <TouchableOpacity style={styles.routeButton}>
            <Text style={styles.routeButtonText}>Ping Vehicle</Text>  
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Fake Incoming Call Modal */}
      <Modal visible={fakeCallActive} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.fakeCallContainer}>
          <View style={styles.fakeCallHeader}>
            <Text style={styles.incomingLabel}>INCOMING CALL</Text>   
            <Text style={styles.callerName}>Mom</Text>
            <Text style={styles.callerNumber}>Mobile +91 98765 43210</Text>
          </View>

          <View style={styles.fakeCallBody}>
            {/* Visual Call Icon */}
            <View style={styles.phoneIconCircle}>
              <PhoneCall size={64} color="#FFF" />
            </View>
          </View>

          <View style={styles.fakeCallActions}>
            <TouchableOpacity onPress={cancelFakeCall} style={styles.declineButton}>
              <Text style={styles.callButtonText}>Decline</Text>      
            </TouchableOpacity>

            <TouchableOpacity onPress={cancelFakeCall} style={styles.acceptButton}>
              <Text style={styles.callButtonText}>Accept</Text>       
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffdad6',
    borderWidth: 1,
    borderColor: '#ffb3ae',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#93000a',
    lineHeight: 20,
    fontWeight: '600',
  },
  alertButton: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: (width * 0.55) / 2,
    backgroundColor: '#ffdad6',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#ffb3ae',
  },
  alertButtonActive: {
    backgroundColor: '#ac2b2e',
    borderColor: '#ac2b2e',
  },
  alertInnerCircle: {
    width: width * 0.46,
    height: width * 0.46,
    borderRadius: (width * 0.46) / 2,
    backgroundColor: '#ac2b2e',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#ac2b2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  alertButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,    fontWeight: 'bold',
    color: '#1a1c1b',
    marginBottom: 12,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addContactText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ac2b2e',
  },
  toolsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  toolCardActive: {
    backgroundColor: '#ac2b2e',
    borderColor: '#ac2b2e',
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1c1b',
    marginTop: 10,
  },
  toolTextActive: {
    color: '#FFF',
  },
  toolDesc: {
    fontSize: 11,
    color: '#59413f',
    textAlign: 'center',
    marginTop: 4,
  },
  toolDescActive: {
    color: '#ffdad6',
  },
  contactsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#faf9f7',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  contactPhone: {
    fontSize: 12,
    color: '#59413f',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5fff3',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#346645',
    fontWeight: '600',
  },
  shelterCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    padding: 16,
    marginBottom: 20,
  },
  shelterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shelterName: {
    fontSize: 15,    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  shelterDetails: {
    fontSize: 12,
    color: '#59413f',
    marginTop: 6,
    marginBottom: 12,
  },
  routeButton: {
    backgroundColor: '#4e5f7e',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Fake Call styles
  fakeCallContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  fakeCallHeader: {
    alignItems: 'center',
    marginTop: 40,
  },
  incomingLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  callerName: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 12,
  },
  callerNumber: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },
  fakeCallBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fakeCallActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  declineButton: {
    backgroundColor: '#EF4444',
    width: width * 0.35,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    width: width * 0.35,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
