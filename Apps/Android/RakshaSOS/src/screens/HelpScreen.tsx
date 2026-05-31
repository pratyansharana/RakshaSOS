import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  LifeBuoy,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Play,
  Heart
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GuideItem {
  question: string;
  answer: string;
  category: 'basics' | 'advanced' | 'legal';
}

export default function HelpScreen({ navigation }: any) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const guides: GuideItem[] = [
    {
      category: 'basics',
      question: 'How do I trigger an SOS alert?',
      answer: 'Press and hold the red SOS button on the home dashboard for 3 seconds. This will instantly send your GPS coordinates and an automated distress SMS to all your configured guardians.',
    },
    {
      category: 'basics',
      question: 'How does the Voice SOS work?',
      answer: 'Once enabled, your phone listens for custom voice triggers (like "Help Help" or "Raksha SOS"). It works offline and runs in the background. It will immediately launch the high-volume alarm and start ambient recording.',
    },
    {
      category: 'advanced',
      question: 'Can I simulate a fake call to exit unsafe areas?',   
      answer: 'Yes! Navigate to the Women Safety zone and select "Simulate Fake Call". You can configure a 10s, 30s, or 60s delay. The phone will ring with a realistic call screen so you can excuse yourself safely.',
    },
    {
      category: 'advanced',
      question: 'Is my location tracked continuously?',
      answer: 'No. Your privacy is paramount. RakshaSOS only accesses your location when you actively trigger an SOS, open the map, or activate the safety broadcast. Your path history is stored securely using device encryption.',
    },
    {
      category: 'legal',
      question: 'What legal rights do I have in an emergency?',       
      answer: 'Under Indian law (IPC section 96-106), every citizen has the right to private defense. If you are in immediate threat of physical harm, you are legally permitted to protect yourself using reasonable force.',
    }
  ];

  const toggleExpand = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open safety helpline page.");   
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ac2b2e" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Safety Manual & Guide</Text> 
        <LifeBuoy size={22} color="#ac2b2e" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introCard}>
          <BookOpen size={24} color="#ac2b2e" />
          <Text style={styles.introTitle}>RakshaSOS Knowledge Base</Text>
          <Text style={styles.introText}>
            Learn how to use emergency features, set up safety triggers, and understand your local self-defense rights.
          </Text>
        </View>

        {/* Rapid Tips */}
        <Text style={styles.sectionTitle}>Quick Guidelines</Text>     
        <View style={styles.tipRow}>
          <View style={styles.tipCard}>
            <Zap size={18} color="#ac2b2e" />
            <Text style={styles.tipTitle}>Speed Trigger</Text>        
            <Text style={styles.tipDesc}>Press power key 5 times to force launch SOS.</Text>
          </View>

          <View style={styles.tipCard}>
            <ShieldCheck size={18} color="#346645" />
            <Text style={styles.tipTitle}>Offline Mode</Text>
            <Text style={styles.tipDesc}>SMS triggers work even without cell data.</Text>
          </View>
        </View>

        {/* Guides Accordion */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.guidesContainer}>
          {guides.map((guide, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <View key={idx} style={styles.accordionCard}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleExpand(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accordionQuestion}>{guide.question}</Text>
                  {isExpanded ? (
                    <ChevronUp size={18} color="#ac2b2e" />
                  ) : (
                    <ChevronDown size={18} color="#777" />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.accordionAnswer}>{guide.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Legal Aid and counseling resources */}
        <View style={styles.supportCard}>
          <Heart size={20} color="#ac2b2e" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.supportTitle}>Need professional assistance?</Text>
            <Text style={styles.supportText}>Access government helplines, legal aid councils, and counseling service details.</Text>        
            <TouchableOpacity
              style={styles.supportLinkButton}
              onPress={() => handleOpenLink('https://ncw.nic.in/')}   
            >
              <Text style={styles.supportLinkText}>Visit National Commission for Women &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    flex: 1,
    marginLeft: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  introTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1c1b',
    marginTop: 8,
    marginBottom: 4,
  },
  introText: {
    fontSize: 12,
    color: '#59413f',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1c1b',
    marginBottom: 12,
    marginTop: 8,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tipCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    borderRadius: 10,
    padding: 12,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1c1b',
    marginTop: 6,
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 10,
    color: '#59413f',
    lineHeight: 14,
  },
  guidesContainer: {
    gap: 10,
    marginBottom: 24,
  },
  accordionCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    borderRadius: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFF',
  },
  accordionQuestion: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1c1b',
    flex: 0.95,
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#faf9f7',
    backgroundColor: '#faf9f7',
  },
  accordionAnswer: {
    fontSize: 12,
    color: '#59413f',
    lineHeight: 18,
    marginTop: 8,
  },
  supportCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    padding: 14,
    borderRadius: 12,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ac2b2e',
  },
  supportText: {
    fontSize: 11,
    color: '#59413f',
    lineHeight: 16,
    marginTop: 2,
  },
  supportLinkButton: {
    marginTop: 8,
  },
  supportLinkText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ac2b2e',
  },
});
