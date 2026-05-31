import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Send, Bot, Activity, Droplet, User,
  Flame, Heart, ChevronRight, ChevronLeft, Volume2, VolumeX,
  SkipForward, SkipBack, RefreshCw
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { getRakshaSafetyReply, GroqChatMessage } from '../services/groqAssistant';

const { width } = Dimensions.get('window');
type Tab = 'categories' | 'guide' | 'chat';

interface Category {
  id: string;
  title: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const CATEGORIES: Category[] = [
  { id: 'bleeding', title: 'Bleeding Control', desc: 'Cuts, deep wounds, hemorrhage', color: '#ac2b2e', icon: <Droplet size={28} color="#ac2b2e" /> },
  { id: 'fracture', title: 'Fracture', desc: 'Broken bones, sprains, dislocations', color: '#346645', icon: <User size={28} color="#346645" /> },
  { id: 'unconscious', title: 'Unconscious Person', desc: 'Fainting, unresponsive victim', color: '#4e5f7e', icon: <Activity size={28} color="#4e5f7e" /> },
  { id: 'burns', title: 'Burns Treatment', desc: 'Thermal, chemical, electrical burns', color: '#d97706', icon: <Flame size={28} color="#d97706" /> },
  { id: 'cpr', title: 'CPR Protocol', desc: 'No pulse, not breathing', color: '#ac2b2e', icon: <Heart size={28} color="#ac2b2e" /> },
];

const OFFLINE_STEPS: Record<string, string[]> = {
  bleeding: [
    'Apply firm, direct pressure on the wound using a clean cloth or bandage.',
    'Do NOT remove the cloth if it soaks through — add more layers on top.',
    'Elevate the injured limb above heart level if possible.',
    'If bleeding does not stop in 10 minutes, apply a tourniquet 5cm above the wound.',
    'Keep the patient warm and calm. Call 108 immediately.',
  ],
  fracture: [
    'Do NOT try to realign the broken bone — immobilize it as-is.',
    'Splint the fracture using a rigid object (stick, rolled magazine) tied with cloth.',
    'Apply ice wrapped in cloth to reduce swelling. Never apply ice directly to skin.',
    'Elevate the limb if it is a leg or arm fracture.',
    'Monitor for numbness or loss of circulation below the injury. Call 108.',
  ],
  unconscious: [
    'Check for responsiveness — tap shoulder firmly and shout their name.',
    'Call 108 immediately or ask a bystander to call.',
    'Open the airway: tilt head back gently, lift the chin.',
    'Check for normal breathing for no more than 10 seconds.',
    'If not breathing normally, begin CPR. If breathing, place in recovery position (on their side).',
  ],
  burns: [
    'Remove the person from the source of burn immediately.',
    'Cool the burn under cool (not cold) running water for at least 10–20 minutes.',
    'Do NOT use ice, butter, toothpaste, or any home remedy on the burn.',
    'Cover loosely with a clean non-fluffy material like cling film or a clean plastic bag.',
    'Do not burst any blisters. Seek emergency care for burns larger than 3cm.',
  ],
  cpr: [
    'Check scene safety, then check victim — tap shoulder, shout their name.',
    'Call 108 or ask someone else to call while you start CPR.',
    'Place heel of hand on center of chest. Place other hand on top. Interlock fingers.',
    'Push hard and fast — compress at least 5cm deep, 100–120 times per minute.',
    'After 30 compressions, give 2 rescue breaths if trained. Continue 30:2 ratio until help arrives.',
  ],
};

export default function AssistantScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('categories');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'bot', text: 'Hello! I am RakshaSOS AI. Ask me any safety or first-aid question.' }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Speak current step
  const speakStep = (text: string) => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en-IN',
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Auto-speak when step changes
  useEffect(() => {
    if (steps.length > 0 && tab === 'guide') {
      speakStep(steps[stepIndex]);
    }
  }, [stepIndex, steps, tab]);

  const stopSpeech = () => { Speech.stop(); setIsSpeaking(false); };

  // Fetch AI steps for a category
  const fetchSteps = async (cat: Category) => {
    setLoadingSteps(true);
    setSteps([]);
    setStepIndex(0);
    setTab('guide');
    setActiveCategory(cat);
    try {
      const prompt: GroqChatMessage[] = [{
        role: 'user',
        content: `You are an emergency first-aid instructor. Give me exactly 5 numbered, clear, actionable first-aid steps for "${cat.title}" for a bystander with no medical equipment. Each step must start with the step number like "1." and be one sentence. Respond with ONLY the 5 steps, nothing else.`,
      }];
      const reply = await getRakshaSafetyReply(prompt);
      // Parse numbered steps from AI response
      const parsed = reply
        .split('\n')
        .map(l => l.trim())
        .filter(l => /^\d+\./.test(l))
        .map(l => l.replace(/^\d+\.\s*/, ''));
      if (parsed.length >= 3) {
        setSteps(parsed);
      } else {
        // Fallback to offline steps
        setSteps(OFFLINE_STEPS[cat.id] || [reply]);
      }
    } catch {
      setSteps(OFFLINE_STEPS[cat.id] || ['Unable to load steps. Please check your connection.']);
    } finally {
      setLoadingSteps(false);
    }
  };

  // Chat send
  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;
    const userText = input.trim();
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const history: GroqChatMessage[] = messages
        .filter(m => m.id !== '0')
        .slice(-6)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      history.push({ role: 'user', content: userText });
      const reply = await getRakshaSafetyReply(history);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: `Error: ${e.message || 'Could not reach AI.'}` }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── RENDER CATEGORIES ──────────────────────────────────────────────
  const renderCategories = () => (
    <ScrollView contentContainerStyle={styles.catList} showsVerticalScrollIndicator={false}>
      <View style={styles.heroBox}>
        <View style={styles.heroCircle}><Activity size={44} color="#FFF" /></View>
        <Text style={styles.heroTitle}>AI First Aid Guide</Text>
        <Text style={styles.heroSub}>Select an emergency for live voice-guided instructions powered by Groq AI.</Text>
      </View>
      {CATEGORIES.map(cat => (
        <TouchableOpacity key={cat.id} style={styles.catCard} onPress={() => fetchSteps(cat)} activeOpacity={0.8}>
          <View style={[styles.catIcon, { borderColor: cat.color }]}>{cat.icon}</View>
          <View style={styles.catInfo}>
            <Text style={styles.catTitle}>{cat.title}</Text>
            <Text style={styles.catDesc}>{cat.desc}</Text>
          </View>
          <ChevronRight size={20} color="#bbb" />
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.chatBanner} onPress={() => setTab('chat')}>
        <Bot size={22} color="#FFF" />
        <Text style={styles.chatBannerText}>Ask the AI anything →</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── RENDER GUIDE ───────────────────────────────────────────────────
  const renderGuide = () => {
    const total = steps.length;
    const current = steps[stepIndex] || '';
    const progress = total > 0 ? ((stepIndex + 1) / total) * 100 : 0;
    return (
      <View style={styles.guideFlex}>
        {/* Category Header */}
        <View style={[styles.guideHeader, { backgroundColor: activeCategory?.color || '#ac2b2e' }]}>
          <TouchableOpacity onPress={() => { stopSpeech(); setTab('categories'); }} style={styles.guideBack}>
            <ArrowLeft size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.guideHeaderTitle}>{activeCategory?.title}</Text>
          <TouchableOpacity onPress={() => activeCategory && fetchSteps(activeCategory)} style={styles.refreshBtn}>
            <RefreshCw size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: activeCategory?.color || '#ac2b2e' }]} />
        </View>

        <ScrollView contentContainerStyle={styles.guideBody} showsVerticalScrollIndicator={false}>
          {loadingSteps ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#ac2b2e" />
              <Text style={styles.loadingText}>Generating first-aid steps with Groq AI...</Text>
            </View>
          ) : (
            <>
              {/* Step indicator */}
              <Text style={styles.stepLabel}>Step {stepIndex + 1} of {total}</Text>

              {/* Step card */}
              <View style={[styles.stepCard, { borderLeftColor: activeCategory?.color || '#ac2b2e' }]}>
                <Text style={styles.stepText}>{current}</Text>
              </View>

              {/* All steps list */}
              <Text style={styles.allStepsLabel}>All Steps</Text>
              {steps.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.stepRow, i === stepIndex && { backgroundColor: '#fdf0f0' }]}
                  onPress={() => setStepIndex(i)}
                >
                  <View style={[styles.stepDot, { backgroundColor: i <= stepIndex ? (activeCategory?.color || '#ac2b2e') : '#ddd' }]}>
                    <Text style={styles.stepDotNum}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepRowText, i === stepIndex && { fontWeight: '700', color: '#1a1a1a' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>

        {/* Controls */}
        {!loadingSteps && (
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.ctrlBtn, stepIndex === 0 && styles.ctrlBtnDisabled]}
              onPress={() => { if (stepIndex > 0) setStepIndex(stepIndex - 1); }}
              disabled={stepIndex === 0}
            >
              <SkipBack size={20} color={stepIndex === 0 ? '#ccc' : '#59413f'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctrlBtnMain, { backgroundColor: activeCategory?.color || '#ac2b2e' }]}
              onPress={() => isSpeaking ? stopSpeech() : speakStep(current)}
            >
              {isSpeaking ? <VolumeX size={28} color="#FFF" /> : <Volume2 size={28} color="#FFF" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctrlBtn, stepIndex === total - 1 && styles.ctrlBtnDisabled]}
              onPress={() => { if (stepIndex < total - 1) setStepIndex(stepIndex + 1); }}
              disabled={stepIndex === total - 1}
            >
              <SkipForward size={20} color={stepIndex === total - 1 ? '#ccc' : '#59413f'} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── RENDER CHAT ────────────────────────────────────────────────────
  const renderChat = () => (
    <KeyboardAvoidingView
      style={styles.chatFlex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.chatHeaderBar}>
        <TouchableOpacity onPress={() => setTab('categories')}><ArrowLeft size={22} color="#ac2b2e" /></TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>Raksha AI Chat</Text>
        <Bot size={22} color="#ac2b2e" />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.chatMessages} showsVerticalScrollIndicator={false}>
        {messages.map(m => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={[styles.bubbleText, m.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot]}>{m.text}</Text>
          </View>
        ))}
        {chatLoading && (
          <View style={styles.bubbleBot}>
            <ActivityIndicator size="small" color="#ac2b2e" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          placeholder="Ask about any emergency..."
          placeholderTextColor="#aaa"
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]} onPress={handleSend} disabled={!input.trim()}>
          <Send size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header (only on categories tab) */}
      {tab === 'categories' && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
            <ArrowLeft size={22} color="#ac2b2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Guide</Text>
          <TouchableOpacity onPress={() => setTab('chat')} style={styles.headerChat}>
            <Bot size={22} color="#ac2b2e" />
          </TouchableOpacity>
        </View>
      )}

      {tab === 'categories' && renderCategories()}
      {tab === 'guide' && renderGuide()}
      {tab === 'chat' && renderChat()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf9f7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#f0e6e5' },
  headerBack: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  headerChat: { padding: 4 },

  // Categories
  catList: { paddingHorizontal: 16, paddingBottom: 32 },
  heroBox: { alignItems: 'center', paddingVertical: 28 },
  heroCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#ac2b2e', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  heroSub: { fontSize: 13, color: '#777', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  catCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  catIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  catInfo: { flex: 1 },
  catTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  catDesc: { fontSize: 13, color: '#777' },
  chatBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, marginTop: 8, gap: 10 },
  chatBannerText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Guide
  guideFlex: { flex: 1, backgroundColor: '#faf9f7' },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  guideBack: { padding: 4 },
  guideHeaderTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  refreshBtn: { padding: 4 },
  progressBar: { height: 4, backgroundColor: '#eee' },
  progressFill: { height: 4, borderRadius: 2 },
  guideBody: { padding: 16, paddingBottom: 32 },
  loadingBox: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  loadingText: { color: '#777', fontSize: 14, textAlign: 'center' },
  stepLabel: { fontSize: 12, fontWeight: '600', color: '#ac2b2e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  stepCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 22, borderLeftWidth: 5, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  stepText: { fontSize: 17, color: '#1a1a1a', lineHeight: 26, fontWeight: '500' },
  allStepsLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  stepDot: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  stepDotNum: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  stepRowText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 20 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 18, paddingHorizontal: 24, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#f0e6e5' },
  ctrlBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f5f0ee', justifyContent: 'center', alignItems: 'center' },
  ctrlBtnDisabled: { opacity: 0.35 },
  ctrlBtnMain: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', shadowColor: '#ac2b2e', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  // Chat
  chatFlex: { flex: 1, backgroundColor: '#faf9f7' },
  chatHeaderBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#f0e6e5' },
  chatHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  chatMessages: { padding: 16, paddingBottom: 24, gap: 10 },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#ac2b2e', borderBottomRightRadius: 4 },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#FFF' },
  bubbleTextBot: { color: '#1a1a1a' },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#f0e6e5', gap: 10 },
  inputField: { flex: 1, backgroundColor: '#f5f0ee', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#1a1a1a', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ac2b2e', justifyContent: 'center', alignItems: 'center' },
});
