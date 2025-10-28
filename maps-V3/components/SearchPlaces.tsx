import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { newSessionToken, placeDetailsLatLng, placesAutocomplete, PlacePrediction } from '@/lib/googlePlaces';

type Props = {
  placeholder?: string;
  onPlaceSelected: (p: { lat: number; lng: number; description: string }) => void;
  country?: string; // 'BR' opcional
  initialQuery?: string;
};

export default function SearchPlaces({ placeholder = 'Buscar endereço ou lugar...', onPlaceSelected, country = 'BR', initialQuery }: Props) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [preds, setPreds] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef<string>(newSessionToken());
  const debounceRef = useRef<any>(null);

  // garante o posicionamento adequado para a barra de busca
  const insets = useSafeAreaInsets();

  // autocomplete com debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 3) {
      setPreds([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await placesAutocomplete(query, tokenRef.current, { country });
        setPreds(res);
      } catch (e) {
        // silencioso
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  // useEffect(() => {
  //   if (initialQuery !== undefined) setQuery(initialQuery);
  // }, [initialQuery]);

  useEffect(() => {
    setQuery(initialQuery ?? '');
  }, [initialQuery]);

  async function handleSelect(p: PlacePrediction) {
    try {
      setLoading(true);
      const details = await placeDetailsLatLng(p.place_id, tokenRef.current);
      // fecha dropdown
      setPreds([]);
      setQuery(p.description);
      // renova token para próxima busca
      tokenRef.current = newSessionToken();
      onPlaceSelected({ lat: details.lat, lng: details.lng, description: p.description });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.wrapper, { top: insets.top + 12 }]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 6 }} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {loading ? <Ionicons name="sync" size={18} color="#aaa" /> : null}
      </View>

      {preds.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={preds}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                <Ionicons name="location-outline" size={16} color="#666" style={{ marginRight: 8 }} />
                <Text numberOfLines={2} style={styles.itemText}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 16, left: 16, right: 16, zIndex: 999, elevation: 10 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, height: 44,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#000' },
  dropdown: {
    marginTop: 6, backgroundColor: '#fff', borderRadius: 10, maxHeight: 240,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
    overflow: 'hidden',
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  itemText: { flex: 1, color: '#333' },
});
