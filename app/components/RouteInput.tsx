import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { newSessionToken, placeDetailsLatLng, placesAutocomplete, PlacePrediction } from '@/lib/googlePlaces';

type Props = {
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    onPlaceSelected?: (p: { lat: number; lng: number; description: string }) => void;
    country?: string;
    containerStyle?: StyleProp<ViewStyle>;
};

export default function RouteInput({
    placeholder,
    value,
    onChangeText,
    onPlaceSelected,
    country = 'BR',
    containerStyle
}: Props) {
    const [preds, setPreds] = useState<PlacePrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const tokenRef = useRef<string>(newSessionToken());
    const debounceRef = useRef<any>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Autocomplete logic
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Only search if focused and value has length
        if (!isFocused || !value || value.length < 3) {
            setPreds([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await placesAutocomplete(value, tokenRef.current, { country });
                setPreds(res);
            } catch (e) {
                console.log('Autocomplete error', e);
            } finally {
                setLoading(false);
            }
        }, 350);
    }, [value, isFocused, country]);

    async function handleSelect(p: PlacePrediction) {
        try {
            setLoading(true);
            const details = await placeDetailsLatLng(p.place_id, tokenRef.current);
            setPreds([]);
            onChangeText(p.description);
            tokenRef.current = newSessionToken();
            if (onPlaceSelected) {
                onPlaceSelected({ lat: details.lat, lng: details.lng, description: p.description });
            }
        } catch (e) {
            console.log('Details error', e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        // Delay blur to allow click on item
                        setTimeout(() => setIsFocused(false), 200);
                    }}
                    autoCorrect={false}
                />
                {loading && <ActivityIndicator size="small" color="#888" style={{ marginRight: 8 }} />}
            </View>

            {preds.length > 0 && isFocused && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={preds}
                        keyboardShouldPersistTaps="handled"
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                                <Ionicons name="location-outline" size={16} color="#666" style={{ marginRight: 8 }} />
                                <Text numberOfLines={1} style={styles.itemText}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                        style={{ maxHeight: 150 }}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        zIndex: 10, // Ensure dropdown is above other elements
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    input: {
        flex: 1,
        padding: 8,
        fontSize: 14,
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 4,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        zIndex: 1000,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemText: {
        fontSize: 13,
        color: '#333',
    },
});
