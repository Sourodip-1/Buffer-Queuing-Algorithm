import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator, Keyboard, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LocationPickerProps {
  venue: string;
  setVenue: (venue: string) => void;
  latitude?: number;
  longitude?: number;
  onLocationSelect?: (lat: number, lon: number) => void;
}

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker({ venue, setVenue, latitude, longitude, onLocationSelect }: LocationPickerProps) {
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [currentLat, setCurrentLat] = useState<number>(latitude || 52.517);
  const [currentLon, setCurrentLon] = useState<number>(longitude || 13.388);
  const [userLocationFetched, setUserLocationFetched] = useState(false);

  const webViewRef = useRef<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!latitude && !longitude && !userLocationFetched) {
      getUserLocation();
    }
  }, []);

  // Search Address via Nominatim
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&email=contact@bufferqueuing.com`, {
        headers: {
          'user-agent': 'BufferQueuingApp/1.0'
        }
      });
      if (!response.ok) {
        console.warn(`Nominatim search error: ${response.status}`);
        return;
      }
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVenueChange = (text: string) => {
    setVenue(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length > 2) {
      searchTimeout.current = setTimeout(() => searchAddress(text), 600);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (item: Suggestion) => {
    Keyboard.dismiss();
    setVenue(item.display_name);
    setShowSuggestions(false);
    setCurrentLat(parseFloat(item.lat));
    setCurrentLon(parseFloat(item.lon));
    if (onLocationSelect) {
      onLocationSelect(parseFloat(item.lat), parseFloat(item.lon));
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&email=contact@bufferqueuing.com`, {
        headers: {
          'user-agent': 'BufferQueuingApp/1.0'
        }
      });
      if (!response.ok) {
        console.warn(`Nominatim reverse error: ${response.status}`);
        return;
      }
      const data = await response.json();
      if (data && data.display_name) {
        setVenue(data.display_name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentLat(location.coords.latitude);
      setCurrentLon(location.coords.longitude);
      setUserLocationFetched(true);
    } catch (e) {
      console.error("Error getting location:", e);
    }
  };

  const openMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMapModalVisible(true);
    if (!userLocationFetched && !latitude && !longitude) {
      getUserLocation();
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PIN_LOCATION') {
        Haptics.selectionAsync();
        setCurrentLat(data.lat);
        setCurrentLon(data.lon);
        reverseGeocode(data.lat, data.lon);
        if (onLocationSelect) {
          onLocationSelect(data.lat, data.lon);
        }
        setMapModalVisible(false);
      }
    } catch (e) {
      console.error("Error parsing message from webview:", e);
    }
  };

  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
      <link href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" rel="stylesheet" />
      <style>
          body { margin: 0; padding: 0; font-family: sans-serif; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; }
          .pin-button {
            position: absolute;
            bottom: 32px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #3A82F6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10;
            display: none;
          }
      </style>
  </head>
  <body>
      <div id="map"></div>
      <button id="pinBtn" class="pin-button">Pin Location</button>
      <script>
          let marker = null;
          let selectedLat = ${currentLat};
          let selectedLon = ${currentLon};

          const map = new maplibregl.Map({
              style: 'https://tiles.openfreemap.org/styles/liberty',
              center: [selectedLon, selectedLat],
              zoom: ${userLocationFetched || latitude ? 14 : 9.5},
              container: 'map',
          });

          // Add initial marker if we have coords
          marker = new maplibregl.Marker({ color: '#3A82F6' })
              .setLngLat([selectedLon, selectedLat])
              .addTo(map);

          map.on('click', (e) => {
              selectedLon = e.lngLat.lng;
              selectedLat = e.lngLat.lat;
              
              if (marker) {
                  marker.setLngLat([selectedLon, selectedLat]);
              } else {
                  marker = new maplibregl.Marker({ color: '#3A82F6' })
                      .setLngLat([selectedLon, selectedLat])
                      .addTo(map);
              }
              
              document.getElementById('pinBtn').style.display = 'block';
          });

          document.getElementById('pinBtn').addEventListener('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PIN_LOCATION',
                  lat: selectedLat,
                  lon: selectedLon
              }));
          });
      </script>
  </body>
  </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <TextInput 
          mode="outlined"
          label="Venue"
          placeholder="Search location or type address"
          value={venue}
          onChangeText={handleVenueChange}
          outlineColor={theme.colors.outlineVariant}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          style={styles.paperInput}
          right={
            isSearching ? (
              <TextInput.Icon icon={() => <ActivityIndicator size="small" color={theme.colors.primary} />} />
            ) : venue.length > 0 ? (
              <TextInput.Icon icon="close" onPress={() => { handleVenueChange(''); }} />
            ) : (
              <TextInput.Icon icon="map-marker" />
            )
          }
        />
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item) => (
            <TouchableOpacity key={item.place_id} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
              <MaterialIcons name="place" size={20} color={theme.colors.onSurfaceVariant} style={{ marginRight: 8 }} />
              <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.previewMapContainer}>
        {/* We use a static WebView for preview, but cover it with an invisible touchable to prevent scroll hijacking */}
        <WebView
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
          scrollEnabled={false}
          pointerEvents="none"
        />
        <TouchableOpacity style={styles.previewOverlay} onPress={openMap} activeOpacity={0.9}>
          <View style={styles.expandButton}>
            <MaterialIcons name="fullscreen" size={20} color="#fff" />
            <Text style={styles.expandButtonText}>Expand Map</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={mapModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMapModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ flex: 1 }}>
            <WebView
              ref={webViewRef}
              source={{ html: mapHtml }}
              onMessage={handleMessage}
              style={{ flex: 1 }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 8,
  },
  paperInput: {
    backgroundColor: theme.colors.surface,
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerHighest,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  previewMapContainer: {
    height: 180,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    position: 'relative',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  expandButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
});
