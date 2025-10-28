import 'dotenv/config';
import fetch from 'node-fetch';

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;
if (!GOOGLE_KEY) {
  console.error('❌ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY não definida');
  process.exit(1);
}

type LatLng = { lat: number; lng: number; description?: string };

async function findPlaceLatLngFromText(
  text: string,
  opts?: { region?: string; locationBiasPoint?: { lat: number; lng: number } }
): Promise<LatLng | null> {
  // ----- Places: Find Place From Text -----
  const params = new URLSearchParams({
    input: text,                 // NÃO codifique manualmente
    inputtype: 'textquery',
    fields: 'geometry,name',     // NÃO codifique manualmente
    key: GOOGLE_KEY,
  });
  if (opts?.region) params.set('region', opts.region);
  if (opts?.locationBiasPoint) {
    const { lat, lng } = opts.locationBiasPoint;
    params.set('locationbias', `point:${lat},${lng}`);
  }

  const placesUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params.toString()}`;
  // console.log('Places URL:', placesUrl); // debug
  const pRes = await fetch(placesUrl);
  const pJson: any = await pRes.json();

  if (pJson.status === 'OK' && Array.isArray(pJson.candidates) && pJson.candidates.length) {
    const c = pJson.candidates[0];
    const loc = c.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng, description: c.name };
  } else {
    console.log('⚠️ Places:', pJson.status, pJson.error_message);
  }

  // ----- Fallback: Geocoding -----
  const gParams = new URLSearchParams({ address: text, key: GOOGLE_KEY });
  if (opts?.region) gParams.set('region', opts.region);
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?${gParams.toString()}`;
  // console.log('Geocode URL:', geocodeUrl); // debug
  const gRes = await fetch(geocodeUrl);
  const gJson: any = await gRes.json();

  if (gJson.status === 'OK' && Array.isArray(gJson.results) && gJson.results.length) {
    const r = gJson.results[0];
    const loc = r.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng, description: r.formatted_address };
  } else {
    console.log('⚠️ Geocoding:', gJson.status, gJson.error_message);
  }

  return null;
}

(async () => {
  const input = '58CC7WF8+MJG'; // seu plus code
  const resolved = await findPlaceLatLngFromText(input, { region: 'br' });
  if (resolved) {
    console.log('✅', resolved);
  } else {
    console.log('❌ Não encontrado:', input);
  }
})();
