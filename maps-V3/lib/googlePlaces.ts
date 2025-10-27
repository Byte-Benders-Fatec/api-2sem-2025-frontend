const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;

export type PlacePrediction = {
  place_id: string;
  description: string;
};

export async function placesAutocomplete(
  input: string,
  sessionToken: string,
  opts?: { country?: string }
): Promise<PlacePrediction[]> {
  const params = new URLSearchParams({
    input,
    key: API_KEY,
    sessiontoken: sessionToken,
    // limite por país opcional (ex.: BR)
    ...(opts?.country ? { components: `country:${opts.country}` } : {}),
  });

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(json.error_message || json.status);
  }
  return (json.predictions || []).map((p: any) => ({
    place_id: p.place_id,
    description: p.description,
  }));
}

export async function placeDetailsLatLng(
  placeId: string,
  sessionToken: string
): Promise<{ lat: number; lng: number; name?: string; address?: string }> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'geometry,name,formatted_address',
    key: API_KEY,
    sessiontoken: sessionToken,
  });
  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'OK') {
    throw new Error(json.error_message || json.status);
  }
  const g = json.result.geometry.location;
  return {
    lat: g.lat,
    lng: g.lng,
    name: json.result.name,
    address: json.result.formatted_address,
  };
}

// gerador de sessionToken bem simples
export function newSessionToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
