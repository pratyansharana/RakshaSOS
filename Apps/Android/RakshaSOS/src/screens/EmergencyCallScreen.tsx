import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Phone,
  Plus,
  Trash2,
  PhoneCall,
  User,
  ShieldAlert,
  HeartPulse,
  Flame,
  UserCheck
} from 'lucide-react-native';
import { auth } from '../config/firebaseconfig';
import { getUserEmergencyContacts } from '../services/sosAlerts';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export default function EmergencyCallScreen({ navigation }: any) {    
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');

  const systemHelplines = [
    { name: 'National Emergency', number: '112', icon: ShieldAlert, color: '#ac2b2e' },
    { name: 'Police Helpline', number: '100', icon: ShieldAlert, color: '#3b5998' },
    { name: 'Ambulance Dispatch', number: '108', icon: HeartPulse, color: '#346645' },
    { name: 'Fire Response', number: '101', icon: Flame, color: '#e67e22' },
    { name: 'Women Helpline', number: '1091', icon: UserCheck, color: '#9b59b6' },
  ];

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    getUserEmergencyContacts(uid)
      .then((savedContacts) => {
        setContacts(
          savedContacts
            .filter((contact) => contact.phone_number)
            .map((contact) => ({
              id: contact.id,
              name: contact.name ?? 'Emergency contact',
              phone: contact.phone_number ?? '',
              relation: contact.relationship ?? 'Guardian',
            })),
        );
      })
      .catch((error) => {
        console.error('Error loading emergency contacts:', error);
      });
  }, []);

  const handleCall = (name: string, number: string) => {
    Alert.alert(
      "Confirm Call",
      `Initiate emergency call to ${name} (${number})?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Call Now", 
          onPress: () => {
            const phoneNumber = number.replace(/[^0-9+]/g, '');
            Linking.openURL(`tel:${phoneNumber}`).catch(() => {
              Alert.alert("Call failed", "Could not open dialer. Please dial manually.");
            });
          } 
        }
      ]
    );
  };

  const handleAddContact = () => {
    if (!newName || !newPhone) {
      Alert.alert("Input Error", "Please fill in Name and Phone Number.");
      return;
    }
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newName,
      phone: newPhone,
      relation: newRelation || 'Guardian',
    };
    setContacts([...contacts, newContact]);
    setNewName('');
    setNewPhone('');
    setNewRelation('');
    setModalVisible(false);
  };

  const handleDeleteContact = (id: string, name: string) => {
    Alert.alert(
      "Delete Contact",
      `Remove ${name} from your SOS quick-dial list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setContacts(contacts.filter(c => c.id !== id))
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ac2b2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Call Center</Text> 
        <Phone size={22} color="#ac2b2e" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <PhoneCall size={20} color="#ac2b2e" />
          <Text style={styles.bannerText}>
            Direct dialing is integrated. In an active crisis, tap any contact to initiate dial.
          </Text>
        </View>

        {/* Section: Official Helpline */}
        <Text style={styles.sectionTitle}>Official Emergency Lines</Text>
        <View style={styles.helplineGrid}>
          {systemHelplines.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.helplineCard, { borderLeftColor: item.color }]}
                onPress={() => handleCall(item.name, item.number)}    
              >
                <View style={styles.helplineLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
                    <IconComp size={20} color={item.color} />
                  </View>
                  <View>
                    <Text style={styles.helplineName}>{item.name}</Text>
                    <Text style={styles.helplineNumber}>{item.number}</Text>
                  </View>
                </View>
                <PhoneCall size={18} color="#ac2b2e" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section: Personal Guardians */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Guardians</Text> 
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Plus size={16} color="#ac2b2e" />
            <Text style={styles.addButtonText}>Add Contact</Text>     
          </TouchableOpacity>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
          </View>
        ) : (
          <View style={styles.guardianList}>
            {contacts.map(contact => (
              <View key={contact.id} style={styles.guardianCard}>     
                <TouchableOpacity
                  style={styles.guardianInfo}
                  onPress={() => handleCall(contact.name, contact.phone)}
                >
                  <View style={styles.guardianAvatar}>
                    <User size={20} color="#59413f" />
                  </View>
                  <View>
                    <Text style={styles.guardianName}>{contact.name}</Text>
                    <Text style={styles.guardianPhone}>{contact.phone}</Text>
                    <Text style={styles.guardianRelation}>{contact.relation}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteContact(contact.id, contact.name)}
                >
                  <Trash2 size={18} color="#ac2b2e" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add SOS Guardian</Text>   

            <TextInput
              style={styles.input}
              placeholder="Guardian's Name"
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g. +91 98765 00000)"       
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g. Spouse, Friend)"        
              value={newRelation}
              onChangeText={setNewRelation}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelBtn]}        
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>      
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveBtn]}
                onPress={handleAddContact}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  content: {
    padding: 16,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#fff1f0',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: '#ac2b2e',
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1c1b',
    marginBottom: 12,
  },
  helplineGrid: {
    gap: 10,
    marginBottom: 24,
  },
  helplineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    borderLeftWidth: 4,
    padding: 14,
  },
  helplineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helplineName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  helplineNumber: {
    fontSize: 12,
    color: '#59413f',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    color: '#ac2b2e',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e0bfbc',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#59413f',
  },
  guardianList: {
    gap: 12,
    paddingBottom: 40,
  },
  guardianCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    padding: 14,
  },
  guardianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  guardianAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5efe0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guardianName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  guardianPhone: {
    fontSize: 12,
    color: '#59413f',
    marginTop: 1,
  },
  guardianRelation: {
    fontSize: 10,
    color: '#ac2b2e',
    fontWeight: 'bold',
    backgroundColor: '#fff1f0',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1c1b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0bfbc',
    backgroundColor: '#faf9f7',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#faf9f7',
    borderWidth: 1,
    borderColor: '#e0bfbc',
  },
  cancelBtnText: {
    color: '#59413f',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#ac2b2e',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
