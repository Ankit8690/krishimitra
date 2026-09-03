// Emoji per commodity name (matches strings returned by data.gov.in).
// Falls back to a generic 🌱 for unknown commodities.
const ICONS: Record<string, string> = {
  Wheat: "🌾", Rice: "🍚", Paddy: "🌾", "Paddy(Common)": "🌾", "Paddy(Basmati)": "🌾",
  Maize: "🌽", Bajra: "🌾", Jowar: "🌾", Ragi: "🌾", Barley: "🌾",
  Cotton: "🧵", Sugarcane: "🎋", Jute: "🌿",
  Potato: "🥔", Onion: "🧅", Tomato: "🍅", Cabbage: "🥬", Cauliflower: "🥦",
  Brinjal: "🍆", Carrot: "🥕", Radish: "🥕", Peas: "🫛", "Peas(Dry)": "🫛",
  "Peas Wet": "🫛", "Green Chilli": "🌶️", "Bhindi(Ladies Finger)": "🌱",
  Bhindi: "🌱", Cucumbar: "🥒", Cucumber: "🥒", "Bitter gourd": "🥒",
  "Bottle gourd": "🥒", Pumpkin: "🎃", Ginger: "🫚", Garlic: "🧄",
  Turmeric: "🌱", Coriander: "🌿", "Coriander(Leaves)": "🌿", Spinach: "🥬",
  Beetroot: "🫐",
  "Bengal Gram Dal(Chana)": "🫘", "Bengal Gram(Gram)(Whole)": "🫘",
  "Black Gram": "🫘", "Green Gram": "🫘", "Green Gram Dal(Moong)": "🫘",
  Arhar: "🫘", "Arhar Dal(Tur)": "🫘", Lentil: "🫘", "Masur Dal": "🫘",
  Mustard: "🌻", Soybean: "🫘", Groundnut: "🥜", Sesame: "🌱",
  Sunflower: "🌻", Castor: "🌱", "Guar Seed(Cluster Beans Seed)": "🫛",
  Apple: "🍎", Banana: "🍌", Grapes: "🍇", Mango: "🥭", Orange: "🍊",
  Papaya: "🌱", Pomegranate: "🌱", Guava: "🌱", Watermelon: "🍉",
  Coconut: "🥥", Lemon: "🍋",
  "Pigeon pea": "🫘", Chickpea: "🫘",
};

export function commodityIcon(name: string): string {
  return ICONS[name] ?? "🌱";
}
