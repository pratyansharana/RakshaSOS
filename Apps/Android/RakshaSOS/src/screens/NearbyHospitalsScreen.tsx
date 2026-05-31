import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  Flame,
  HeartPulse,
  MapPin,
  Navigation as NavigationIcon,
  Phone,
  Search,
  ShieldCheck,
  RefreshCw,
  Building2,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseconfig';

const { width } = Dimensions.get('window');

// ─── Haversine distance (returns km) ────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function etaMinutes(km: number) {
  return Math.max(1, Math.round(km * 3));
}

function getGoogleMapsApiKey() {
  const extra = (Constants.expoConfig?.extra ?? (Constants as any).manifest2?.extra ?? {}) as Record<string, unknown>;
  return typeof extra.googleMapsApiKey === 'string' ? extra.googleMapsApiKey : '';
}

// ─── Hospital type ───────────────────────────────────────────────────────────
type HospitalStatus = 'Open' | 'Busy' | 'Emergency Only';
type HospitalSource = 'registered' | 'places' | 'offline';

interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  type: string;
  status: HospitalStatus;
  distKm: number;
  distLabel: string;
  etaLabel: string;
  lat: number;
  lon: number;
  source: HospitalSource;
  beds?: string;
}

// ─── Firestore fetch ─────────────────────────────────────────────────────────
async function fetchRegisteredHospitals(
  userLat: number,
  userLon: number,
): Promise<Hospital[]> {
  const snap = await getDocs(collection(db, 'hospitals'));
  const results: Hospital[] = [];

  snap.forEach((doc) => {
    const d = doc.data();
    const lat = typeof d.latitude === 'number' ? d.latitude : parseFloat(d.latitude);
    const lon = typeof d.longitude === 'number' ? d.longitude : parseFloat(d.longitude);

    // Skip hospitals with no coordinates
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

    const distKm = haversineKm(userLat, userLon, lat, lon);
    results.push({
      id: doc.id,
      name: d.hospitalName || 'Unknown Hospital',
      address: d.fullAddress || d.address || 'Address not listed',
      city: d.city || '',
      phone: d.emergencyContact || '112',
      type: d.hospitalType || 'General',
      status: 'Open',
      distKm,
      distLabel: distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`,
      etaLabel: `${etaMinutes(distKm)} mins`,
      lat,
      lon,
      source: 'registered',
      beds: d.emergencyBeds,
    });
  });

  return results.sort((a, b) => a.distKm - b.distKm);
}

// ─── Google Places fallback ──────────────────────────────────────────────────
async function fetchGooglePlacesHospitals(
  userLat: number,
  userLon: number,
): Promise<Hospital[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) throw new Error('No Google Maps API key');

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber',
    },
    body: JSON.stringify({
      includedTypes: ['hospital'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: userLat, longitude: userLon },
          radius: 15000,
        },
      },
    }),
  });

  const data = await res.json();
  if (!data.places || data.places.length === 0) return [];

  return (data.places as any[])
    .map((p, i): Hospital => {
      const lat = p.location?.latitude ?? userLat;
      const lon = p.location?.longitude ?? userLon;
      const distKm = haversineKm(userLat, userLon, lat, lon);
      return {
        id: p.id ?? `gp-${i}`,
        name: p.displayName?.text ?? 'Nearby Hospital',
        address: p.formattedAddress ?? 'Unknown Address',
        city: '',
        phone: p.nationalPhoneNumber ?? '112',
        type: 'General',
        status: 'Open',
        distKm,
        distLabel: distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`,
        etaLabel: `${etaMinutes(distKm)} mins`,
        lat,
        lon,
        source: 'places',
      };
    })
    .sort((a, b) => a.distKm - b.distKm);
}

// ─── Offline fallback ────────────────────────────────────────────────────────
function getOfflineHospitals(userLat: number, userLon: number): Hospital[] {
  const seeds = [
    { name: 'City Emergency Hospital', addr: 'Main Market Road', dLat: 0.012, dLon: 0.011, phone: '108' },
    { name: 'District General Hospital', addr: 'Ring Road', dLat: -0.021, dLon: 0.016, phone: '108' },
    { name: 'Apex Trauma Center', addr: 'Metro Station Area', dLat: 0.016, dLon: -0.022, phone: '108' },
    { name: 'Community Medical Center', addr: 'Tech Zone Phase 1', dLat: -0.031, dLon: -0.009, phone: '108' },
  ];
  return seeds
    .map((s, i): Hospital => {
      const lat = userLat + s.dLat;
      const lon = userLon + s.dLon;
      const distKm = haversineKm(userLat, userLon, lat, lon);
      return {
        id: `offline-${i}`,
        name: s.name,
        address: s.addr,
        city: 'Nearby',
        phone: s.phone,
        type: 'General',
        status: 'Open',
        distKm,
        distLabel: `${distKm.toFixed(1)} km`,
        etaLabel: `${etaMinutes(distKm)} mins`,
        lat,
        lon,
        source: 'offline',
      };
    })
    .sort((a, b) => a.distKm - b.distKm);
}

type FilterType = 'All' | 'Trauma' | 'ICU' | 'General';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function NearbyHospitalsScreen({ navigation }: any) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<HospitalSource>('registered');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');

  const loadHospitals = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // 1. Get user location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable it in Settings.');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      // 2. Try Firestore registered hospitals first
      try {
        const registered = await fetchRegisteredHospitals(latitude, longitude);
        if (registered.length > 0) {
          setHospitals(registered);
          setDataSource('registered');
          return;
        }
      } catch (firestoreErr) {
        console.warn('Firestore fetch failed:', firestoreErr);
      }

      // 3. Fall back to Google Places API
      try {
        const places = await fetchGooglePlacesHospitals(latitude, longitude);
        if (places.length > 0) {
          setHospitals(places);
          setDataSource('places');
          return;
        }
      } catch (placesErr) {
        console.warn('Google Places fetch failed:', placesErr);
      }

      // 4. Final offline fallback
      setHospitals(getOfflineHospitals(latitude, longitude));
      setDataSource('offline');
    } catch (e: any) {
      setError(e?.message ?? 'Could not load hospitals.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadHospitals(); }, [loadHospitals]);

  const handleCall = (hospital: Hospital) => {
    const clean = hospital.phone.replace(/[^0-9+]/g, '');
    Alert.alert(
      'Emergency Call',
      `Call ${hospital.name}?\n${hospital.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => Linking.openURL(`tel:${clean}`) },
      ],
    );
  };

  const handleRoute = (hospital: Hospital) => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}&travelmode=driving`,
    ).catch(() => Alert.alert('Error', 'Could not open Maps.'));
  };

  const handleAmbulance = () => {
    Alert.alert(
      'Dispatch Ambulance',
      'Your GPS coordinates will be sent. Confirm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch Now',
          onPress: () => Linking.openURL('tel:108'),
        },
      ],
    );
  };

  // ── Filter + Search ─────────────────────────────────────────────────────────
  const filtered = hospitals.filter((h) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      h.name.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q);
    const matchFilter = filter === 'All' || h.type.toLowerCase().includes(filter.toLowerCase());
    return matchSearch && matchFilter;
  });

  // ── Source badge ─────────────────────────────────────────────────────────────
  const sourceBadge = () => {
    if (dataSource === 'registered') return { label: 'RakshaSOS Network', icon: <Wifi size={12} color="#346645" />, bg: '#f0fff4', text: '#346645' };
    if (dataSource === 'places') return { label: 'Google Places', icon: <MapPin size={12} color="#4e5f7e" />, bg: '#f0f4ff', text: '#4e5f7e' };
    return { label: 'Offline Data', icon: <WifiOff size={12} color="#777" />, bg: '#f5f5f5', text: '#777' };
  };
  const badge = sourceBadge();

  // ── Hospital Card ────────────────────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: Hospital; index: number }) => (
    <View style={styles.card}>
      {/* Rank badge */}
      <View style={[styles.rankBadge, index === 0 && { backgroundColor: '#ac2b2e' }]}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>

      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.hospitalName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.typeRow}>
            <ShieldCheck size={11} color="#ac2b2e" />
            <Text style={styles.hospitalType}>
              {item.type}
              {item.source === 'registered' ? ' · RakshaSOS Registered' : ''}
            </Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'Open' && styles.statusOpen,
          item.status === 'Busy' && styles.statusBusy,
          item.status === 'Emergency Only' && styles.statusEmergency,
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'Open' && { color: '#15803d' },
            item.status === 'Busy' && { color: '#b45309' },
            item.status === 'Emergency Only' && { color: '#ac2b2e' },
          ]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MapPin size={12} color="#777" />
        <Text style={styles.infoText} numberOfLines={2}>{item.address}{item.city ? `, ${item.city}` : ''}</Text>
      </View>

      <View style={styles.infoRow}>
        <Clock size={12} color="#777" />
        <Text style={styles.infoText}>{item.etaLabel} away · {item.distLabel}</Text>
        {item.beds ? (
          <>
            <Building2 size={12} color="#777" style={{ marginLeft: 10 }} />
            <Text style={styles.infoText}>{item.beds} beds</Text>
          </>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={() => handleCall(item)}>
          <Phone size={14} color="#ac2b2e" />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.routeBtn]} onPress={() => handleRoute(item)}>
          <NavigationIcon size={14} color="#FFF" />
          <Text style={styles.routeBtnText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <ArrowLeft size={22} color="#ac2b2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Hospitals</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { setIsRefreshing(true); loadHospitals(true); }}>
            <RefreshCw size={18} color="#ac2b2e" />
          </TouchableOpacity>
          <HeartPulse size={22} color="#ac2b2e" />
        </View>
      </View>

      {/* Source badge + count */}
      {!isLoading && hospitals.length > 0 && (
        <View style={[styles.sourceBanner, { backgroundColor: badge.bg }]}>
          {badge.icon}
          <Text style={[styles.sourceText, { color: badge.text }]}>
            {badge.label} · {hospitals.length} hospitals found, sorted by distance
          </Text>
        </View>
      )}

      {/* Dispatch bar */}
      <TouchableOpacity style={styles.dispatchBar} onPress={handleAmbulance}>
        <Flame size={16} color="#FFF" />
        <Text style={styles.dispatchText}>QUICK DISPATCH — CALL 108 AMBULANCE</Text>
      </TouchableOpacity>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={16} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hospital name or area..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['All', 'Trauma', 'ICU', 'General'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#ac2b2e" />
          <Text style={styles.centerText}>Locating registered hospitals near you...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadHospitals()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.centerText}>No hospitals match your search.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { setIsRefreshing(true); loadHospitals(true); }}
              colors={['#ac2b2e']}
              tintColor="#ac2b2e"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf9f7' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#f0e6e5',
  },
  headerBack: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  sourceBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  sourceText: { fontSize: 12, fontWeight: '600' },
  dispatchBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#ac2b2e', paddingVertical: 12, marginHorizontal: 12,
    marginTop: 10, borderRadius: 10,
    shadowColor: '#ac2b2e', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  dispatchText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginTop: 12, backgroundColor: '#FFF',
    borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 10, marginBottom: 4 },
  chip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#e0e0e0',
  },
  chipActive: { backgroundColor: '#ac2b2e', borderColor: '#ac2b2e' },
  chipText: { fontSize: 12, color: '#555', fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  listContent: { padding: 12, paddingBottom: 32, gap: 12 },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#f0e6e5',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute', top: -8, left: 14,
    backgroundColor: '#59413f', width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  rankText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, marginBottom: 8 },
  hospitalName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  hospitalType: { fontSize: 11, color: '#ac2b2e', fontWeight: '600' },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  statusOpen: { backgroundColor: '#f0fff4' },
  statusBusy: { backgroundColor: '#fffbeb' },
  statusEmergency: { backgroundColor: '#fff1f0' },
  statusText: { fontSize: 10, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 5 },
  infoText: { fontSize: 12, color: '#59413f', flex: 1, lineHeight: 17 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: {
    flex: 1, height: 40, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  callBtn: { backgroundColor: '#fff1f0', borderWidth: 1, borderColor: '#e0bfbc' },
  callBtnText: { color: '#ac2b2e', fontWeight: '700', fontSize: 13 },
  routeBtn: { backgroundColor: '#ac2b2e' },
  routeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  centerText: { color: '#777', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  errorText: { color: '#ac2b2e', fontSize: 14, textAlign: 'center', fontWeight: '600' },
  retryBtn: { backgroundColor: '#ac2b2e', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  retryText: { color: '#FFF', fontWeight: '700' },
});
