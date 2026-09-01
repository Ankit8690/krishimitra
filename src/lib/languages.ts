// Languages available for chat (LLM + STT + TTS).
// This is separate from the app UI i18n (only en/hi/pa) — chat supports many more.

export type ChatLangCode =
  | "en" | "hi" | "pa" | "bn" | "gu" | "kn"
  | "ml" | "mr" | "or" | "ta" | "te" | "ur" | "as";

export type ChatLanguage = {
  code: ChatLangCode;
  name: string;         // English name shown in dropdown label
  nativeName: string;   // Own-language name shown in the dropdown option
  bcp47: string;        // for SpeechSynthesis voice selection
  whisper: string | null; // Whisper language code (null → let Whisper auto-detect)
};

export const CHAT_LANGUAGES: ChatLanguage[] = [
  { code: "en", name: "English",   nativeName: "English",   bcp47: "en-IN", whisper: "en" },
  { code: "hi", name: "Hindi",     nativeName: "हिन्दी",     bcp47: "hi-IN", whisper: "hi" },
  { code: "pa", name: "Punjabi",   nativeName: "ਪੰਜਾਬੀ",     bcp47: "pa-IN", whisper: "pa" },
  { code: "bn", name: "Bengali",   nativeName: "বাংলা",      bcp47: "bn-IN", whisper: "bn" },
  { code: "gu", name: "Gujarati",  nativeName: "ગુજરાતી",    bcp47: "gu-IN", whisper: "gu" },
  { code: "kn", name: "Kannada",   nativeName: "ಕನ್ನಡ",     bcp47: "kn-IN", whisper: "kn" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം",   bcp47: "ml-IN", whisper: "ml" },
  { code: "mr", name: "Marathi",   nativeName: "मराठी",      bcp47: "mr-IN", whisper: "mr" },
  { code: "or", name: "Odia",      nativeName: "ଓଡ଼ିଆ",      bcp47: "or-IN", whisper: null },
  { code: "ta", name: "Tamil",     nativeName: "தமிழ்",     bcp47: "ta-IN", whisper: "ta" },
  { code: "te", name: "Telugu",    nativeName: "తెలుగు",     bcp47: "te-IN", whisper: "te" },
  { code: "ur", name: "Urdu",      nativeName: "اردو",        bcp47: "ur-IN", whisper: "ur" },
  { code: "as", name: "Assamese",  nativeName: "অসমীয়া",     bcp47: "as-IN", whisper: null },
];

export function findLanguage(code: string | null | undefined): ChatLanguage {
  return CHAT_LANGUAGES.find((l) => l.code === code) ?? CHAT_LANGUAGES[0];
}

// Full names used in the LLM system prompt.
export function languageInstruction(code: ChatLangCode): string {
  const lang = findLanguage(code);
  return `${lang.name} (${lang.nativeName})`;
}
