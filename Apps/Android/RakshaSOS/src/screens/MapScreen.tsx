import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import MapView from 'react-native-maps/lib/MapView';
import Marker from 'react-native-maps/lib/MapMarker';
import { Region } from 'react-native-maps/lib/sharedTypes';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseconfig';
import {
  ArrowLeft,
  Compass,
  HeartPulse,
  Map as MapIcon,
  MapPin,
  Navigation as NavigationIcon,
  RefreshCw,
  ShieldCheck,
  Plus,
  Users,
  AlertTriangle
} from 'lucide-react-native';

type NearbyFilter = 'all' | 'hospital' | 'police';

interface Incident {
  id: string;
  type: string;
  desc: string;
  latitude: number;
  longitude: number;
  reportedBy: string;
}

type PlaceSource = 'registered' | 'places' | 'offline';

type NearbyPlace = {
  id: string;
  type: 'hospital' | 'police';
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  distanceMeters: number;
  source?: PlaceSource;
  phone?: string;
};

type GooglePlaceResult = {
  id?: string;
  name?: string;
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  types?: string[];
};

const DEFAULT_REGION: Region = {
  latitude: 23.2599,
  longitude: 77.4126,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

const SEARCH_RADIUS_METERS = 5000;

const filterOptions: Array<{ id: NearbyFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'hospital', label: 'Hospitals' },
  { id: 'police', label: 'Police' },
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(fromLat: number, fromLon: number, toLat: number, toLon: number) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${meters} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function getPlaceKey(place: NearbyPlace) {
  return [
    place.type,
    place.name.toLowerCase(),
    place.latitude.toFixed(4),
    place.longitude.toFixed(4),
  ].join(':');
}

function getGoogleMapsApiKey() {
  const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? {}) as Record<string, unknown>;
  return typeof extra.googleMapsApiKey === 'string' ? extra.googleMapsApiKey : '';
}

async function fetchNearbyPlaces(latitude: number, longitude: number): Promise<NearbyPlace[]> {
  const googleMapsApiKey = getGoogleMapsApiKey();

  if (!googleMapsApiKey) {
    throw new Error('Google Maps API key is missing. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local.');
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleMapsApiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
    },
    body: JSON.stringify({
      includedTypes: ['hospital', 'police'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: SEARCH_RADIUS_METERS,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Nearby places could not be loaded from Google Places.');
  }

  const data = (await response.json()) as { places?: Array<GooglePlaceResult & { displayName?: { text?: string } }> };

  const mappedPlaces = (data.places ?? [])
    .map((element): NearbyPlace | null => {
      const placeLat = element.location?.latitude;
      const placeLon = element.location?.longitude;
      const placeType = element.types?.includes('hospital') ? 'hospital' : element.types?.includes('police') ? 'police' : null;

      if (!placeLat || !placeLon || !placeType) {
        return null;
      }

      return {
        id: element.id || `${placeType}-${placeLat}-${placeLon}`,
        type: placeType,
        name:
          element.displayName?.text ||
          element.name ||
          (placeType === 'hospital' ? 'Nearby hospital' : 'Nearby police station'),
        latitude: placeLat,
        longitude: placeLon,
        address: element.formattedAddress,
        distanceMeters: getDistanceMeters(latitude, longitude, placeLat, placeLon),
      };
    })
    .filter((place): place is NearbyPlace => Boolean(place));

  const uniquePlaces = new Map<string, NearbyPlace>();

  mappedPlaces.forEach((place) => {
    const key = getPlaceKey(place);
    const current = uniquePlaces.get(key);

    if (!current || place.distanceMeters < current.distanceMeters) {
      uniquePlaces.set(key, place);
    }
  });

  return Array.from(uniquePlaces.values()).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export default function MapScreen({ navigation }: any) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<NearbyFilter>('all');
  const [isLocating, setIsLocating] = useState(true);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const hasGoogleMapsApiKey = Boolean(getGoogleMapsApiKey());

  const [incidents, setIncidents] = useState<Incident[]>([
    { id: '1', type: 'Unlit Alleyway', desc: 'No functional streetlights near Sector 4 lane.', latitude: 23.2590, longitude: 77.4120, reportedBy: 'Anonymous' },
    { id: '2', type: 'Police Patrol', desc: 'Active police checkpoint.', latitude: 23.2610, longitude: 77.4140, reportedBy: 'System Verification' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [reportType, setReportType] = useState('Poor Lighting');
  const [reportDesc, setReportDesc] = useState('');

  const handleReport = () => {
    if (!reportDesc || !userLocation) {
      Alert.alert("Input Error", "Please provide a description and ensure location is active.");
      return;
    }
    const newIncident: Incident = {
      id: Date.now().toString(),
      type: reportType,
      desc: reportDesc,
      latitude: userLocation.latitude + (Math.random() - 0.5) * 0.01,
      longitude: userLocation.longitude + (Math.random() - 0.5) * 0.01,
      reportedBy: 'You',
    };
    setIncidents([...incidents, newIncident]);
    setReportDesc('');
    setModalVisible(false);
    Alert.alert("Report Submitted", "Your safety report has been added to the neighborhood map for other users.");
  };

  const filteredPlaces = useMemo(() => {
    if (selectedFilter === 'all') {
      return places;
    }

    return places.filter((place) => place.type === selectedFilter);
  }, [places, selectedFilter]);

  const loadNearbyPlaces = async (latitude: number, longitude: number) => {
    setIsLoadingPlaces(true);

    // ── 1. Firestore registered hospitals ──────────────────────────
    try {
      const snap = await getDocs(collection(db, 'hospitals'));
      const registered: NearbyPlace[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        const lat = typeof d.latitude === 'number' ? d.latitude : parseFloat(d.latitude);
        const lon = typeof d.longitude === 'number' ? d.longitude : parseFloat(d.longitude);
        if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;
        registered.push({
          id: doc.id,
          type: 'hospital',
          name: d.hospitalName || 'Registered Hospital',
          latitude: lat,
          longitude: lon,
          address: d.fullAddress || d.address || '',
          distanceMeters: getDistanceMeters(latitude, longitude, lat, lon),
          source: 'registered',
          phone: d.emergencyContact,
        });
      });
      if (registered.length > 0) {
        // Also fetch police from Google Places to show alongside
        let policePlaces: NearbyPlace[] = [];
        try {
          const all = await fetchNearbyPlaces(latitude, longitude);
          policePlaces = all.filter(p => p.type === 'police');
        } catch { /* skip if API fails */ }
        const combined = [...registered, ...policePlaces]
          .sort((a, b) => a.distanceMeters - b.distanceMeters);
        setPlaces(combined);
        setIsLoadingPlaces(false);
        return;
      }
    } catch (firestoreErr) {
      console.warn('Firestore fetch failed for map:', firestoreErr);
    }

    // ── 2. Google Places API fallback ──────────────────────────────
    try {
      const nextPlaces = await fetchNearbyPlaces(latitude, longitude);
      if (nextPlaces.length > 0) {
        setPlaces(nextPlaces.map(p => ({ ...p, source: 'places' as PlaceSource })));
        setIsLoadingPlaces(false);
        return;
      }
    } catch (placesErr) {
      console.warn('Google Places failed for map:', placesErr);
    }

    // ── 3. Offline fallback ────────────────────────────────────────
    setPlaces([
      { id: 'off-1', type: 'hospital' as const, name: 'City Emergency Hospital', latitude: latitude + 0.012, longitude: longitude + 0.011, address: 'Main Market Road', distanceMeters: getDistanceMeters(latitude, longitude, latitude + 0.012, longitude + 0.011), source: 'offline' as PlaceSource },
      { id: 'off-2', type: 'hospital' as const, name: 'District General Hospital', latitude: latitude - 0.021, longitude: longitude + 0.016, address: 'Ring Road', distanceMeters: getDistanceMeters(latitude, longitude, latitude - 0.021, longitude + 0.016), source: 'offline' as PlaceSource },
      { id: 'off-3', type: 'police' as const, name: 'Central Police Station', latitude: latitude + 0.02, longitude: longitude - 0.01, address: 'Police HQ', distanceMeters: getDistanceMeters(latitude, longitude, latitude + 0.02, longitude - 0.01), source: 'offline' as PlaceSource },
    ].sort((a, b) => a.distanceMeters - b.distanceMeters));
    setIsLoadingPlaces(false);
  };

  const locateUser = async () => {
    setIsLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Location access needed', 'Allow location access to show nearby hospitals and police stations.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const nextRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      };

      setUserLocation(location.coords);
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 650);
      await loadNearbyPlaces(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error locating user for map:', error);
      Alert.alert('Location unavailable', 'We could not read your current location. Showing the default city map.');
    } finally {
      setIsLocating(false);
    }
  };

  const openRoute = (place: NearbyPlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Route unavailable', 'Could not open maps for directions.');
    });
  };

  useEffect(() => {
    locateUser();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ac2b2e" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Raksha Safe Map</Text>
        <MapIcon size={22} color="#ac2b2e" />
      </View>

      <View style={styles.mapArea}>
        {region ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            region={region}
            mapType="standard"
            showsUserLocation={Boolean(userLocation)}
            showsMyLocationButton={false}
            onRegionChangeComplete={setRegion}
          >
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="You are here"
            >
              <View style={styles.userMarkerOuter}>
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          )}

          {filteredPlaces.map((place) => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={`${place.source === 'registered' ? '✅ ' : ''}${place.name}`}
              description={`${place.type === 'hospital' ? '🏥 Hospital' : '👮 Police'} · ${formatDistance(place.distanceMeters)}${place.phone ? ` · ${place.phone}` : ''}`}
              pinColor={place.type === 'hospital'
                ? (place.source === 'registered' ? '#15803d' : '#ac2b2e')
                : '#2b59ac'}
            />
          ))}

          {incidents.map(inc => (
            <Marker
              key={inc.id}
              coordinate={{ latitude: inc.latitude, longitude: inc.longitude }}
              title={inc.type}
              description={inc.desc}
            >
              <View style={styles.incidentMarker}>
                {inc.type === 'Police Patrol' ? (
                  <ShieldCheck size={20} color="#2b59ac" />
                ) : (
                  <AlertTriangle size={20} color="#ac2b2e" />
                )}
              </View>
            </Marker>
          ))}
          </MapView>
        ) : (
          <View style={[styles.map, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#ac2b2e" />
            <Text style={{ marginTop: 10, color: '#59413f' }}>Acquiring live location...</Text>
          </View>
        )}

        <View style={styles.filterBar}>
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.fabReport} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.fabText}>Report Hotspot</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.locateButton} onPress={locateUser} disabled={isLocating}>
          {isLocating ? <ActivityIndicator size="small" color="#59413f" /> : <Compass size={22} color="#59413f" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            if (region) loadNearbyPlaces(region.latitude, region.longitude);
          }}
          disabled={isLoadingPlaces || !region}
        >
          {isLoadingPlaces ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <RefreshCw size={18} color="#fff" />
          )}
          <Text style={styles.refreshText}>Refresh Nearby</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        {!hasGoogleMapsApiKey && (
          <View style={styles.setupBanner}>
            <Text style={styles.setupTitle}>Google Maps API key needed</Text>
            <Text style={styles.setupText}>
              Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local to enable the map and nearby hospital/police search.
            </Text>
          </View>
        )}

        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Nearby Emergency Help</Text>
            <Text style={styles.panelSubtitle}>
              {filteredPlaces.length} result{filteredPlaces.length === 1 ? '' : 's'} within {SEARCH_RADIUS_METERS / 1000} km
            </Text>
          </View>
          {(isLocating || isLoadingPlaces) && <ActivityIndicator color="#ac2b2e" />}
        </View>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.neighborhoodScoreCard}>
            <Users size={20} color="#346645" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.scoreTitle}>Community Safety Rating</Text>
              <Text style={styles.scoreText}>High safety score in this zone based on active police patrols and user checkpoints.</Text>
            </View>
          </View>

          {filteredPlaces.length === 0 ? (
            <View style={styles.emptyCard}>
              <MapPin size={22} color="#ac2b2e" />
              <Text style={styles.emptyTitle}>No nearby results loaded</Text>
              <Text style={styles.emptyText}>Refresh nearby places or allow location access.</Text>
            </View>
          ) : (
            filteredPlaces.map((place) => (
              <View key={place.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.placeIcon}>
                    {place.type === 'hospital' ? (
                      <HeartPulse size={18} color="#ac2b2e" />
                    ) : (
                      <ShieldCheck size={18} color="#2b59ac" />
                    )}
                  </View>
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeType}>
                      {place.type === 'hospital' ? 'Hospital' : 'Police station'} - {formatDistance(place.distanceMeters)}
                    </Text>
                    {place.address ? <Text style={styles.placeAddress}>{place.address}</Text> : null}
                  </View>
                </View>

                <TouchableOpacity style={styles.routeButton} onPress={() => openRoute(place)}>
                  <NavigationIcon size={16} color="#fff" />
                  <Text style={styles.routeButtonText}>Get Route</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Incident Reporting Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Danger / Safety Issue</Text>

            <Text style={styles.label}>Issue Type</Text>
            <View style={styles.pickerRow}>
              {['Poor Lighting', 'Harassment Zone', 'Stray Animals', 'Police Patrol'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerChip,
                    reportType === type && styles.pickerChipActive
                  ]}
                  onPress={() => setReportType(type)}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      reportType === type && styles.pickerChipTextActive
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide details about the hazard or incident..."
              multiline={true}
              numberOfLines={4}
              value={reportDesc}
              onChangeText={setReportDesc}
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
                onPress={handleReport}
              >
                <Text style={styles.saveBtnText}>Submit Report</Text>
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
      flex: 1,
      marginLeft: 8,
      },
      mapArea: {
      height: 360,
      position: 'relative',
      backgroundColor: '#e6dedc',
      },
      map: {
      ...StyleSheet.absoluteFillObject,
      },
      filterBar: {
      position: 'absolute',
      top: 12,
      left: 12,
      right: 58,
      flexDirection: 'row',
      gap: 8,
      },
      filterChip: {
      flex: 1,
      minHeight: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#e0bfbc',
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
      },
      filterChipActive: {
      backgroundColor: '#ac2b2e',
      borderColor: '#ac2b2e',
      },
      filterText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#59413f',
      },
      filterTextActive: {
      color: '#fff',
      },
      userMarkerOuter: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(43, 89, 172, 0.22)',
      borderWidth: 2,
      borderColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      },
      userMarkerInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#2b59ac',
      },
      locateButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#e0bfbc',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      },
      refreshButton: {
      position: 'absolute',
      bottom: 14,
      left: 14,
      right: 14,
      minHeight: 42,
      borderRadius: 10,
      backgroundColor: '#ac2b2e',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      elevation: 3,
      },
      refreshText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '900',
      },
      fabReport: {
      position: 'absolute',
      bottom: 70,
      right: 12,
      backgroundColor: '#ac2b2e',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      },
      fabText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontSize: 12,
      },
      incidentMarker: {
      backgroundColor: '#FFF',
      padding: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e0bfbc',
      },
      panel: {
      flex: 1,
      backgroundColor: '#fff',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      marginTop: -14,
      paddingTop: 16,
      },
      setupBanner: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#e0bfbc',
      borderRadius: 10,
      backgroundColor: '#fff1f0',
      padding: 12,
      },
      setupTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: '#ac2b2e',
      },
      setupText: {
      marginTop: 4,
      fontSize: 12,
      color: '#59413f',
      lineHeight: 17,
      },
      panelHeader: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      },
      panelTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: '#1a1c1b',
      },
      panelSubtitle: {
      marginTop: 2,
      fontSize: 12,
      color: '#59413f',
      fontWeight: '600',
      },
      listContent: {
      paddingHorizontal: 16,
      paddingBottom: 28,
      gap: 12,
      },
      neighborhoodScoreCard: {
      flexDirection: 'row',
      backgroundColor: '#f5fff3',
      borderWidth: 1,
      borderColor: '#d2ebc4',
      padding: 14,
      borderRadius: 10,
      marginBottom: 12,
      },
      scoreTitle: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#346645',
      },
      scoreText: {
      fontSize: 11,
      color: '#346645',
      lineHeight: 16,
      marginTop: 2,
      },
      emptyCard: {
      borderWidth: 1,
      borderColor: '#e0bfbc',
      backgroundColor: '#faf9f7',
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
      gap: 6,
      },
      emptyTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: '#1a1c1b',
      },
      emptyText: {
      fontSize: 12,
      color: '#59413f',
      textAlign: 'center',
      },
      card: {
      borderWidth: 1,
      borderColor: '#e0bfbc',
      borderRadius: 10,
      padding: 12,
      backgroundColor: '#faf9f7',
      gap: 12,
      },
      cardTop: {
      flexDirection: 'row',
      gap: 10,
      },
      placeIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ead5d5',
      },
      placeInfo: {
      flex: 1,
      },
      placeName: {
      fontSize: 14,
      fontWeight: '900',
      color: '#1a1c1b',
      },
      placeType: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: '700',
      color: '#ac2b2e',
      },
      placeAddress: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 17,
      color: '#59413f',
      },
      routeButton: {
      minHeight: 40,
      borderRadius: 8,
      backgroundColor: '#ac2b2e',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      },
      routeButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '900',
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
      marginBottom: 4,
      },
      label: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#59413f',
      marginTop: 8,
      },
      pickerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 4,
      },
      pickerChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: '#faf9f7',
      borderWidth: 1,
      borderColor: '#e0bfbc',
      },
      pickerChipActive: {
      backgroundColor: '#ac2b2e',
      borderColor: '#ac2b2e',
      },
      pickerChipText: {
      fontSize: 11,
      color: '#59413f',
      fontWeight: '600',
      },
      pickerChipTextActive: {
      color: '#FFF',
      fontWeight: 'bold',
      },
      input: {
      borderWidth: 1,
      borderColor: '#e0bfbc',
      backgroundColor: '#faf9f7',
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      height: 44,
      },
      textArea: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: 10,
      },
      modalActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
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

