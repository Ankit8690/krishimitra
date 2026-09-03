// Translation dictionaries for data that comes from external APIs
// (mandi commodities, weather conditions, scheme names). These are lightweight
// lookups — the source data stays in English, we translate at render time.
//
// Missing keys silently fall back to the original English string, so a new
// crop showing up from data.gov.in won't break the UI.

import type { ChatLangCode } from "@/lib/languages";

type Lang = "en" | "hi" | "pa";

function narrowLang(l: string): Lang {
  return l === "hi" || l === "pa" ? l : "en";
}

// ---------------------------------------------------------------------------
// COMMODITIES — top 60 crops that show up in the data.gov.in Agmarknet feed.
// Names are the exact strings the API returns (case-sensitive match).
// ---------------------------------------------------------------------------

const COMMODITIES: Record<string, { hi: string; pa: string }> = {
  Wheat: { hi: "गेहूँ", pa: "ਕਣਕ" },
  Rice: { hi: "चावल", pa: "ਚੌਲ" },
  Paddy: { hi: "धान", pa: "ਧਾਨ" },
  "Paddy(Common)": { hi: "धान (सामान्य)", pa: "ਧਾਨ (ਸਧਾਰਨ)" },
  "Paddy(Basmati)": { hi: "बासमती धान", pa: "ਬਾਸਮਤੀ ਧਾਨ" },
  Maize: { hi: "मक्का", pa: "ਮੱਕੀ" },
  Bajra: { hi: "बाजरा", pa: "ਬਾਜਰਾ" },
  Jowar: { hi: "ज्वार", pa: "ਜਵਾਰ" },
  Ragi: { hi: "रागी", pa: "ਰਾਗੀ" },
  Barley: { hi: "जौ", pa: "ਜੌਂ" },

  Cotton: { hi: "कपास", pa: "ਕਪਾਹ" },
  Sugarcane: { hi: "गन्ना", pa: "ਗੰਨਾ" },
  Jute: { hi: "जूट", pa: "ਜੂਟ" },

  Potato: { hi: "आलू", pa: "ਆਲੂ" },
  Onion: { hi: "प्याज़", pa: "ਪਿਆਜ਼" },
  Tomato: { hi: "टमाटर", pa: "ਟਮਾਟਰ" },
  Cabbage: { hi: "पत्ता गोभी", pa: "ਪੱਤਾ ਗੋਭੀ" },
  Cauliflower: { hi: "फूल गोभी", pa: "ਫੁੱਲ ਗੋਭੀ" },
  Brinjal: { hi: "बैंगन", pa: "ਬੈਂਗਣ" },
  Carrot: { hi: "गाजर", pa: "ਗਾਜਰ" },
  Radish: { hi: "मूली", pa: "ਮੂਲੀ" },
  Peas: { hi: "मटर", pa: "ਮਟਰ" },
  "Peas(Dry)": { hi: "मटर (सूखी)", pa: "ਮਟਰ (ਸੁੱਕੀ)" },
  "Peas Wet": { hi: "मटर (गीली)", pa: "ਮਟਰ (ਗਿੱਲੀ)" },
  "Green Chilli": { hi: "हरी मिर्च", pa: "ਹਰੀ ਮਿਰਚ" },
  "Bhindi(Ladies Finger)": { hi: "भिंडी", pa: "ਭਿੰਡੀ" },
  Bhindi: { hi: "भिंडी", pa: "ਭਿੰਡੀ" },
  Cucumbar: { hi: "खीरा", pa: "ਖੀਰਾ" },
  Cucumber: { hi: "खीरा", pa: "ਖੀਰਾ" },
  "Bitter gourd": { hi: "करेला", pa: "ਕਰੇਲਾ" },
  "Bottle gourd": { hi: "लौकी", pa: "ਲੌਕੀ" },
  Pumpkin: { hi: "कद्दू", pa: "ਕੱਦੂ" },
  Ginger: { hi: "अदरक", pa: "ਅਦਰਕ" },
  Garlic: { hi: "लहसुन", pa: "ਲਸਣ" },
  Turmeric: { hi: "हल्दी", pa: "ਹਲਦੀ" },
  Coriander: { hi: "धनिया", pa: "ਧਨੀਆ" },
  "Coriander(Leaves)": { hi: "हरा धनिया", pa: "ਹਰਾ ਧਨੀਆ" },
  Spinach: { hi: "पालक", pa: "ਪਾਲਕ" },
  Beetroot: { hi: "चुकंदर", pa: "ਚੁਕੰਦਰ" },
  "Bengal Gram Dal(Chana)": { hi: "चना दाल", pa: "ਛੋਲੇ ਦੀ ਦਾਲ" },
  "Bengal Gram(Gram)(Whole)": { hi: "चना (साबुत)", pa: "ਛੋਲੇ (ਸਾਬਤ)" },
  "Black Gram": { hi: "उड़द", pa: "ਮਾਂਹ" },
  "Green Gram": { hi: "मूँग", pa: "ਮੂੰਗ" },
  "Green Gram Dal(Moong)": { hi: "मूँग दाल", pa: "ਮੂੰਗ ਦਾਲ" },
  Arhar: { hi: "अरहर", pa: "ਅਰਹਰ" },
  "Arhar Dal(Tur)": { hi: "अरहर दाल", pa: "ਅਰਹਰ ਦਾਲ" },
  Lentil: { hi: "मसूर", pa: "ਮਸਰ" },
  "Masur Dal": { hi: "मसूर दाल", pa: "ਮਸਰ ਦਾਲ" },
  Mustard: { hi: "सरसों", pa: "ਸਰੋਂ" },
  Soybean: { hi: "सोयाबीन", pa: "ਸੋਇਆਬੀਨ" },
  Groundnut: { hi: "मूँगफली", pa: "ਮੂੰਗਫਲੀ" },
  Sesame: { hi: "तिल", pa: "ਤਿਲ" },
  Sunflower: { hi: "सूरजमुखी", pa: "ਸੂਰਜਮੁਖੀ" },
  Castor: { hi: "अरंडी", pa: "ਅਰੰਡੀ" },
  "Guar Seed(Cluster Beans Seed)": { hi: "ग्वार बीज", pa: "ਗਵਾਰ ਬੀਜ" },

  Apple: { hi: "सेब", pa: "ਸੇਬ" },
  Banana: { hi: "केला", pa: "ਕੇਲਾ" },
  Grapes: { hi: "अंगूर", pa: "ਅੰਗੂਰ" },
  Mango: { hi: "आम", pa: "ਅੰਬ" },
  Orange: { hi: "संतरा", pa: "ਸੰਤਰਾ" },
  Papaya: { hi: "पपीता", pa: "ਪਪੀਤਾ" },
  Pomegranate: { hi: "अनार", pa: "ਅਨਾਰ" },
  Guava: { hi: "अमरूद", pa: "ਅਮਰੂਦ" },
  Watermelon: { hi: "तरबूज़", pa: "ਤਰਬੂਜ਼" },
  Coconut: { hi: "नारियल", pa: "ਨਾਰੀਅਲ" },
  Lemon: { hi: "नींबू", pa: "ਨਿੰਬੂ" },

  "Pigeon pea": { hi: "अरहर", pa: "ਅਰਹਰ" },
  Chickpea: { hi: "चना", pa: "ਛੋਲੇ" },
};

export function tCommodity(name: string, locale: string): string {
  if (!name) return name;
  const l = narrowLang(locale);
  if (l === "en") return name;
  return COMMODITIES[name]?.[l] ?? name;
}

// ---------------------------------------------------------------------------
// WEATHER — WMO weather-interpretation code labels + spray-safety reason strings
// ---------------------------------------------------------------------------

const WEATHER_LABELS: Record<string, { hi: string; pa: string }> = {
  Clear: { hi: "साफ़", pa: "ਸਾਫ਼" },
  "Mostly clear": { hi: "अधिकतर साफ़", pa: "ਜ਼ਿਆਦਾਤਰ ਸਾਫ਼" },
  Cloudy: { hi: "बादल", pa: "ਬੱਦਲਵਾਈ" },
  Fog: { hi: "कोहरा", pa: "ਧੁੰਦ" },
  Drizzle: { hi: "बूँदाबाँदी", pa: "ਬੂੰਦਾਬਾਂਦੀ" },
  Rain: { hi: "बारिश", pa: "ਬਾਰਿਸ਼" },
  "Freezing rain": { hi: "जमने वाली बारिश", pa: "ਜੰਮਣ ਵਾਲੀ ਬਾਰਿਸ਼" },
  Snow: { hi: "बर्फ़", pa: "ਬਰਫ਼" },
  "Rain showers": { hi: "बौछारें", pa: "ਬੌਛਾੜਾਂ" },
  Thunderstorm: { hi: "आँधी-तूफ़ान", pa: "ਹਨੇਰੀ-ਤੂਫ਼ਾਨ" },
  "Thunderstorm w/ hail": {
    hi: "तूफ़ान और ओले",
    pa: "ਤੂਫ਼ਾਨ ਤੇ ਗੜੇਮਾਰੀ",
  },
  Unknown: { hi: "अज्ञात", pa: "ਅਗਿਆਤ" },
};

export function tWeather(label: string, locale: string): string {
  const l = narrowLang(locale);
  if (l === "en") return label;
  return WEATHER_LABELS[label]?.[l] ?? label;
}

/**
 * Translate the "reason" string returned by the spray advisor. The English is
 * a template — we regex-match it, translate the parts, and rebuild.
 */
export function tSprayReason(reason: string, locale: string): string {
  const l = narrowLang(locale);
  if (l === "en") return reason;
  const rainMatch = reason.match(/Rain likely \((\d+)%\) in next 6 hours/);
  if (rainMatch) {
    if (l === "hi") return `अगले 6 घंटे में बारिश की संभावना (${rainMatch[1]}%)`;
    return `ਅਗਲੇ 6 ਘੰਟਿਆਂ ਵਿੱਚ ਬਾਰਿਸ਼ ਦੀ ਸੰਭਾਵਨਾ (${rainMatch[1]}%)`;
  }
  if (reason === "Low rain risk in next 6 hours") {
    if (l === "hi") return "अगले 6 घंटे में बारिश का ख़तरा कम है";
    return "ਅਗਲੇ 6 ਘੰਟਿਆਂ ਵਿੱਚ ਬਾਰਿਸ਼ ਦਾ ਖ਼ਤਰਾ ਘੱਟ ਹੈ";
  }
  return reason;
}

// ---------------------------------------------------------------------------
// SCHEMES — short name + benefit line for the 7 seeded schemes.
// Full scheme summaries stay in English for accuracy.
// ---------------------------------------------------------------------------

const SCHEME_BENEFITS: Record<string, { hi: string; pa: string }> = {
  "pm-kisan": {
    hi: "साल में ₹6,000 तीन क़िस्तों में",
    pa: "ਸਾਲ ਵਿੱਚ ₹6,000 ਤਿੰਨ ਕਿਸ਼ਤਾਂ ਵਿੱਚ",
  },
  pmfby: {
    hi: "1.5–5% प्रीमियम पर फसल बीमा",
    pa: "1.5–5% ਪ੍ਰੀਮੀਅਮ 'ਤੇ ਫਸਲ ਬੀਮਾ",
  },
  kcc: {
    hi: "₹3 लाख तक 4% ब्याज पर कर्ज़ (सब्सिडी सहित)",
    pa: "₹3 ਲੱਖ ਤੱਕ 4% ਵਿਆਜ 'ਤੇ ਕਰਜ਼ਾ (ਸਬਸਿਡੀ ਸਮੇਤ)",
  },
  pmksy: {
    hi: "ड्रिप/स्प्रिंकलर पर 55% तक सब्सिडी",
    pa: "ਡ੍ਰਿਪ/ਸਪ੍ਰਿੰਕਲਰ 'ਤੇ 55% ਤੱਕ ਸਬਸਿਡੀ",
  },
  "pm-kusum": {
    hi: "सोलर पंप पर 60% सब्सिडी",
    pa: "ਸੋਲਰ ਪੰਪ 'ਤੇ 60% ਸਬਸਿਡੀ",
  },
  "soil-health-card": {
    hi: "मुफ़्त मिट्टी जाँच और खाद सलाह",
    pa: "ਮੁਫ਼ਤ ਮਿੱਟੀ ਜਾਂਚ ਤੇ ਖਾਦ ਸਲਾਹ",
  },
  enam: {
    hi: "ऑनलाइन सीधे बेचें — कोई बिचौलिया नहीं",
    pa: "ਆਨਲਾਈਨ ਸਿੱਧੇ ਵੇਚੋ — ਕੋਈ ਦਲਾਲ ਨਹੀਂ",
  },
};

const SCHEME_NAMES: Record<string, { hi: string; pa: string }> = {
  "pm-kisan": { hi: "पीएम-किसान सम्मान निधि", pa: "ਪੀਐਮ-ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ" },
  pmfby: {
    hi: "प्रधानमंत्री फसल बीमा योजना",
    pa: "ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ",
  },
  kcc: { hi: "किसान क्रेडिट कार्ड", pa: "ਕਿਸਾਨ ਕ੍ਰੈਡਿਟ ਕਾਰਡ" },
  pmksy: {
    hi: "प्रधानमंत्री कृषि सिंचाई योजना",
    pa: "ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਖੇਤੀ ਸਿੰਚਾਈ ਯੋਜਨਾ",
  },
  "pm-kusum": {
    hi: "पीएम कुसुम (सोलर पंप)",
    pa: "ਪੀਐਮ ਕੁਸੁਮ (ਸੋਲਰ ਪੰਪ)",
  },
  "soil-health-card": {
    hi: "मिट्टी स्वास्थ्य कार्ड योजना",
    pa: "ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਯੋਜਨਾ",
  },
  enam: {
    hi: "ई-नाम (राष्ट्रीय कृषि बाज़ार)",
    pa: "ਈ-ਨਾਮ (ਰਾਸ਼ਟਰੀ ਖੇਤੀ ਬਾਜ਼ਾਰ)",
  },
};

export function tSchemeName(id: string, locale: string, fallback: string): string {
  const l = narrowLang(locale);
  if (l === "en") return fallback;
  return SCHEME_NAMES[id]?.[l] ?? fallback;
}

export function tSchemeBenefit(id: string, locale: string, fallback: string): string {
  const l = narrowLang(locale);
  if (l === "en") return fallback;
  return SCHEME_BENEFITS[id]?.[l] ?? fallback;
}

// ---------------------------------------------------------------------------
// SOIL / IRRIGATION / SEASON — free-word displays elsewhere
// ---------------------------------------------------------------------------

const SEASON: Record<string, { hi: string; pa: string }> = {
  kharif: { hi: "ख़रीफ़", pa: "ਖ਼ਰੀਫ਼" },
  rabi: { hi: "रबी", pa: "ਹਾੜ੍ਹੀ" },
  zaid: { hi: "ज़ायद", pa: "ਜ਼ਾਇਦ" },
  perennial: { hi: "बारहमासी", pa: "ਬਾਰਾਂਮਾਹੀ" },
};

export function tSeason(s: string, locale: string): string {
  const l = narrowLang(locale);
  if (l === "en") return s;
  return SEASON[s]?.[l] ?? s;
}

// Also expose a generic "matches any known dictionary" helper for chat / voice
// synthesis where the source of the string isn't known.
export function tAny(input: string, locale: ChatLangCode | string): string {
  const l = narrowLang(locale);
  if (l === "en") return input;
  return (
    COMMODITIES[input]?.[l] ??
    WEATHER_LABELS[input]?.[l] ??
    input
  );
}
