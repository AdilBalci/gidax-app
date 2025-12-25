import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, ScanLine, Search, AlertTriangle, CheckCircle, XCircle, ChevronRight, ChevronDown, Leaf, Heart, ShieldCheck, TrendingUp, Star, Info, X, Loader2, Upload, Zap, Apple, Coffee, Milk, Cookie, Package, AlertCircle, ThumbsUp, ThumbsDown, Flame, Scale, Activity, Clock, Trash2, Share2, Plus, Minus, Sparkles, Target, Utensils, Wheat, Egg, Fish } from 'lucide-react';
import BarcodeScanner from './components/BarcodeScanner';
import { fetchProductByBarcode, analyzeImageWithClaude } from './services/api';

// ============================================
// SENSITIVITY DATA
// ============================================
const SENSITIVITY_DATA = {
  helal: {
    haram_codes: ["E120", "E441", "E542", "E631", "E635", "E904", "E920", "E921"],
    suspicious_codes: ["E422", "E471", "E472a", "E472b", "E472c", "E472d", "E472e", "E473", "E474", "E475", "E476", "E477", "E478", "E481", "E482", "E483", "E491", "E492", "E493", "E494", "E495"],
    haram_ingredients: ["domuz", "alkol", "şarap", "bira", "jelatin", "bacon", "jambon"]
  },
  boykot: {
    brands: ["coca-cola", "pepsi", "nestle", "starbucks", "mcdonald", "burger king", "kfc", "pizza hut", "dominos", "unilever", "procter", "danone", "kraft", "mondelez", "mars", "kellogg", "heinz", "colgate", "johnson", "loreal", "nivea", "garnier", "pringles", "lays", "doritos", "lipton", "magnum", "algida", "knorr", "nescafe", "kitkat", "milka", "oreo", "fanta", "sprite"]
  },
  yerli: {
    turkish_brands: ["ülker", "eti", "torku", "tadım", "peyman", "tat", "tukaş", "tamek", "pınar", "sütaş", "mis", "içim", "uludağ", "erikli", "hayat", "aytaç", "namet", "banvit", "keskinoğlu", "şenpiliç", "bizim", "yudum", "komili", "kristal", "orkide", "sera", "burcu", "öncü", "selva", "filiz", "pastavilla", "uno", "kent", "dido", "albeni", "çokoprens", "sarelle", "koska", "mado", "kahve dünyası", "eker", "dimes"]
  },
  vegan: {
    animal_ingredients: ["et", "süt", "yumurta", "bal", "jelatin", "peynir", "tereyağ", "kaymak", "krema", "tavuk", "balık", "dana", "kuzu", "sığır", "laktoz", "kazein", "peynir altı suyu", "yoğurt", "sucuk", "pastırma", "sosis"]
  }
};

// ============================================
// ALLERGENS
// ============================================
const ALLERGENS = {
  gluten: { ingredients: ["buğday", "arpa", "çavdar", "yulaf", "un", "ekmek", "makarna", "bulgur"], label: "Gluten" },
  lactose: { ingredients: ["süt", "laktoz", "peynir", "yoğurt", "krema", "tereyağ", "kaymak", "ayran"], label: "Laktoz" },
  egg: { ingredients: ["yumurta", "yumurta akı", "yumurta sarısı", "mayonez"], label: "Yumurta" },
  fish: { ingredients: ["balık", "ton balığı", "somon", "sardalya", "hamsi", "levrek"], label: "Balık" },
  nuts: { ingredients: ["fındık", "fıstık", "badem", "ceviz", "antep fıstığı", "kaju", "yer fıstığı"], label: "Kuruyemiş" },
  soy: { ingredients: ["soya", "soya fasulyesi", "soya sosu", "tofu", "soya lesitini"], label: "Soya" },
  sesame: { ingredients: ["susam", "tahin", "helva"], label: "Susam" }
};

// ============================================
// ADDITIVE DATABASE
// ============================================
const ADDITIVE_DATABASE = {
  "E100": { name: "Kurkumin", risk: 0, category: "Renklendirici", halal: "halal" },
  "E120": { name: "Karmin", risk: 80, category: "Renklendirici", halal: "haram", concern: "Böceklerden elde edilir" },
  "E150d": { name: "Sülfitli Amonyak Karameli", risk: 40, category: "Renklendirici", halal: "halal" },
  "E200": { name: "Sorbik Asit", risk: 10, category: "Koruyucu", halal: "halal" },
  "E202": { name: "Potasyum Sorbat", risk: 15, category: "Koruyucu", halal: "halal" },
  "E211": { name: "Sodyum Benzoat", risk: 50, category: "Koruyucu", halal: "halal", concern: "Hiperaktivite riski" },
  "E220": { name: "Kükürt Dioksit", risk: 60, category: "Koruyucu", halal: "halal", concern: "Astım riski" },
  "E250": { name: "Sodyum Nitrit", risk: 70, category: "Koruyucu", halal: "halal", concern: "Kanserojen olabilir" },
  "E300": { name: "Askorbik Asit (C Vitamini)", risk: 0, category: "Antioksidan", halal: "halal" },
  "E322": { name: "Lesitin", risk: 5, category: "Emülgatör", halal: "halal" },
  "E330": { name: "Sitrik Asit", risk: 0, category: "Asitlik Düzenleyici", halal: "halal" },
  "E407": { name: "Karragenan", risk: 40, category: "Kıvam Arttırıcı", halal: "halal", concern: "Bağırsak iltihabı" },
  "E420": { name: "Sorbitol", risk: 20, category: "Tatlandırıcı", halal: "halal" },
  "E422": { name: "Gliserol", risk: 15, category: "Nem Tutucu", halal: "şüpheli" },
  "E441": { name: "Jelatin", risk: 90, category: "Kıvam Arttırıcı", halal: "haram", concern: "Genellikle domuz kaynaklı" },
  "E471": { name: "Mono ve Digliseritler", risk: 30, category: "Emülgatör", halal: "şüpheli", concern: "Kaynak belirsiz" },
  "E500": { name: "Sodyum Karbonat", risk: 0, category: "Kabartıcı", halal: "halal" },
  "E503": { name: "Amonyum Karbonat", risk: 5, category: "Kabartıcı", halal: "halal" },
  "E621": { name: "Monosodyum Glutamat (MSG)", risk: 45, category: "Lezzet Arttırıcı", halal: "halal", concern: "Baş ağrısı yapabilir" },
  "E631": { name: "Disodyum İnosinat", risk: 50, category: "Lezzet Arttırıcı", halal: "haram" },
  "E904": { name: "Şellak", risk: 40, category: "Parlatıcı", halal: "haram" },
  "E920": { name: "L-Sistein", risk: 60, category: "Un İşleme", halal: "haram", concern: "İnsan saçı/kuş tüyü" },
  "E951": { name: "Aspartam", risk: 50, category: "Tatlandırıcı", halal: "halal", concern: "Fenilketonüri tehlikesi" },
  "E960": { name: "Steviol Glikozitler", risk: 10, category: "Tatlandırıcı", halal: "halal" }
};

// ============================================
// NUTRIENT THRESHOLDS
// ============================================
const NUTRIENT_THRESHOLDS = {
  sugar: { low: 5, medium: 12.5, high: 22.5 },
  fat: { low: 3, medium: 17.5, high: 30 },
  saturated_fat: { low: 1.5, medium: 5, high: 10 },
  salt: { low: 0.3, medium: 1.5, high: 2.5 },
  fiber: { low: 1.5, medium: 3, high: 6 },
  protein: { low: 4, medium: 8, high: 16 }
};

// ============================================
// SAMPLE PRODUCTS
// ============================================
const SAMPLE_PRODUCTS = {
  "8690504055020": {
    name: "Çikolatalı Gofret", brand: "Ülker", category: "Atıştırmalık", serving_size: "36g",
    image: "https://images.openfoodfacts.org/images/products/869/050/405/5020/front_tr.3.400.jpg",
    nutrition: { energy: 520, protein: 6.5, carbohydrates: 58, sugar: 32, fat: 28, saturated_fat: 14, fiber: 2.1, salt: 0.3 },
    ingredients: "Şeker, bitkisel yağ, buğday unu, kakao yağı, peynir altı suyu tozu, tam yağlı süt tozu, kakao kitlesi, emülgatör (soya lesitini E322), kabartma tozu (E500), tuz, aroma",
    additives: ["E322", "E500"], nova_group: 4, nutri_score: "E"
  },
  "8690637912559": {
    name: "Sade Yoğurt", brand: "Sütaş", category: "Süt Ürünü", serving_size: "200g", image: null,
    nutrition: { energy: 63, protein: 3.3, carbohydrates: 4.7, sugar: 4.7, fat: 3.5, saturated_fat: 2.2, fiber: 0, salt: 0.1 },
    ingredients: "Pastörize inek sütü, yoğurt kültürü",
    additives: [], nova_group: 1, nutri_score: "A"
  },
  "5449000000996": {
    name: "Coca-Cola", brand: "Coca-Cola", category: "İçecek", serving_size: "330ml", image: null,
    nutrition: { energy: 42, protein: 0, carbohydrates: 10.6, sugar: 10.6, fat: 0, saturated_fat: 0, fiber: 0, salt: 0 },
    ingredients: "Karbonatlı su, şeker, renklendirici (E150d), fosforik asit, doğal aromalar, kafein",
    additives: ["E150d"], nova_group: 4, nutri_score: "E"
  },
  "8690637001000": {
    name: "Beyaz Peynir", brand: "Pınar", category: "Süt Ürünü", serving_size: "100g", image: null,
    nutrition: { energy: 264, protein: 17, carbohydrates: 2, sugar: 2, fat: 21, saturated_fat: 13, fiber: 0, salt: 2.8 },
    ingredients: "Pastörize inek sütü, peynir mayası, tuz, kalsiyum klorür",
    additives: [], nova_group: 2, nutri_score: "D"
  },
  "8690504352013": {
    name: "Alpella Üçgen Çikolata", brand: "Ülker", category: "Atıştırmalık", serving_size: "30g", image: null,
    nutrition: { energy: 545, protein: 5.8, carbohydrates: 56, sugar: 48, fat: 32, saturated_fat: 18, fiber: 1.5, salt: 0.2 },
    ingredients: "Şeker, kakao yağı, tam yağlı süt tozu, kakao kitlesi, fındık (%5), emülgatör (soya lesitini E322), vanilya aroması",
    additives: ["E322"], nova_group: 4, nutri_score: "E"
  },
  "8699141650018": {
    name: "Eti Burçak", brand: "Eti", category: "Atıştırmalık", serving_size: "25g", image: null,
    nutrition: { energy: 450, protein: 7.5, carbohydrates: 68, sugar: 18, fat: 16, saturated_fat: 7, fiber: 4.5, salt: 0.8 },
    ingredients: "Buğday unu, şeker, bitkisel yağ, buğday kepeği, yulaf ezmesi, kabartma tozu (E500, E503), tuz, aroma",
    additives: ["E500", "E503"], nova_group: 3, nutri_score: "C"
  }
};

// ============================================
// ALTERNATIVES DATABASE
// ============================================
const ALTERNATIVES_DB = {
  "Atıştırmalık": [
    { name: "Tam Tahıllı Bisküvi", brand: "Eti", health_score: 72, key_benefit: "Yüksek lif, düşük şeker", is_turkish: true },
    { name: "Kuru Meyve Karışımı", brand: "Tadım", health_score: 85, key_benefit: "Doğal şeker, vitamin zengin", is_turkish: true },
    { name: "Bitter Çikolata %85", brand: "Torku", health_score: 68, key_benefit: "Düşük şeker, antioksidan", is_turkish: true }
  ],
  "İçecek": [
    { name: "Maden Suyu", brand: "Uludağ", health_score: 95, key_benefit: "Sıfır kalori, mineral", is_turkish: true },
    { name: "Sade Ayran", brand: "Sütaş", health_score: 88, key_benefit: "Probiyotik, protein", is_turkish: true }
  ],
  "Süt Ürünü": [
    { name: "Probiyotik Yoğurt", brand: "Sütaş", health_score: 90, key_benefit: "Sindirim sağlığı", is_turkish: true },
    { name: "Lor Peyniri", brand: "İçim", health_score: 82, key_benefit: "Yüksek protein, düşük yağ", is_turkish: true }
  ]
};

// ============================================
// UTILITY FUNCTIONS  
// ============================================
const calculateHealthScore = (nutrition, additives = [], nova_group = 3) => {
  let score = 70;
  if (nutrition.sugar > NUTRIENT_THRESHOLDS.sugar.high) score -= 15;
  else if (nutrition.sugar > NUTRIENT_THRESHOLDS.sugar.medium) score -= 8;
  else if (nutrition.sugar <= NUTRIENT_THRESHOLDS.sugar.low) score += 3;
  if (nutrition.fat > NUTRIENT_THRESHOLDS.fat.high) score -= 12;
  else if (nutrition.fat > NUTRIENT_THRESHOLDS.fat.medium) score -= 6;
  if (nutrition.saturated_fat > NUTRIENT_THRESHOLDS.saturated_fat.high) score -= 10;
  else if (nutrition.saturated_fat > NUTRIENT_THRESHOLDS.saturated_fat.medium) score -= 5;
  if (nutrition.salt > NUTRIENT_THRESHOLDS.salt.high) score -= 8;
  else if (nutrition.salt > NUTRIENT_THRESHOLDS.salt.medium) score -= 4;
  let additiveRisk = 0;
  additives.forEach(code => { const a = ADDITIVE_DATABASE[code]; if (a) additiveRisk += a.risk / 10; });
  score -= Math.min(20, additiveRisk);
  if (nova_group === 4) score -= 15;
  else if (nova_group === 3) score -= 8;
  else if (nova_group === 1) score += 10;
  if (nutrition.fiber > NUTRIENT_THRESHOLDS.fiber.high) score += 8;
  else if (nutrition.fiber > NUTRIENT_THRESHOLDS.fiber.medium) score += 4;
  if (nutrition.protein > NUTRIENT_THRESHOLDS.protein.high) score += 6;
  else if (nutrition.protein > NUTRIENT_THRESHOLDS.protein.medium) score += 3;
  return Math.max(5, Math.min(100, Math.round(score)));
};

const getGrade = (score) => {
  if (score >= 80) return { grade: 'A', color: '#22C55E', label: 'Çok Sağlıklı' };
  if (score >= 65) return { grade: 'B', color: '#84CC16', label: 'Sağlıklı' };
  if (score >= 50) return { grade: 'C', color: '#F59E0B', label: 'Orta' };
  if (score >= 30) return { grade: 'D', color: '#F97316', label: 'Dikkatli Tüket' };
  return { grade: 'E', color: '#EF4444', label: 'Kaçın' };
};

const getNutrientLevel = (nutrient, value) => {
  const t = NUTRIENT_THRESHOLDS[nutrient];
  if (!t) return { level: 'unknown', icon: '⚪', label: 'Bilinmiyor', color: 'text-slate-400' };
  if (value <= t.low) return { level: 'low', icon: '🟢', label: 'Düşük', color: 'text-emerald-400' };
  if (value <= t.medium) return { level: 'medium', icon: '🟡', label: 'Orta', color: 'text-amber-400' };
  return { level: 'high', icon: '🔴', label: 'Yüksek', color: 'text-red-400' };
};

const getNovaLabel = (nova) => ({ 1: 'İşlenmemiş', 2: 'Az İşlenmiş', 3: 'İşlenmiş', 4: 'Ultra İşlenmiş' }[nova] || 'Bilinmiyor');

const extractAdditives = (ingredients) => [...new Set((ingredients.match(/E\d{3}[a-z]?/gi) || []).map(e => e.toUpperCase()))];

const checkAllergens = (ingredients, userAllergies) => {
  const found = [];
  const lower = ingredients.toLowerCase();
  userAllergies.forEach(key => {
    const a = ALLERGENS[key];
    if (a && a.ingredients.some(i => lower.includes(i))) found.push({ key, ...a });
  });
  return found;
};

const calculatePortionNutrition = (nutrition, servingSize, portionCount) => {
  const grams = parseFloat(servingSize) || 100;
  const mult = (grams * portionCount) / 100;
  const result = {};
  Object.keys(nutrition).forEach(k => { result[k] = Math.round(nutrition[k] * mult * 10) / 10; });
  return result;
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function GidaXApp() {
  const [activeView, setActiveView] = useState('scan');
  const [barcode, setBarcode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [portionCount, setPortionCount] = useState(1);
  const [selectedAdditive, setSelectedAdditive] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [userProfile, setUserProfile] = useState({
    diseases: ['diyabet'],
    sensitivities: ['helal', 'yerli'],
    allergies: ['gluten'],
    goals: ['kilo_verme']
  });
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Handle image capture/select
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalyze = () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      alert('AI görsel analizi yakında aktif olacak! Şimdilik barkod ile arama yapabilirsiniz.');
      setIsAnalyzing(false);
    }, 2000);
  };

  const clearCapturedImage = () => {
    setCapturedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };
  useEffect(() => {
    const f = localStorage.getItem('gidax_favorites');
    const h = localStorage.getItem('gidax_history');
    const p = localStorage.getItem('gidax_profile');
    if (f) setFavorites(JSON.parse(f));
    if (h) setHistory(JSON.parse(h));
    if (p) setUserProfile(JSON.parse(p));
  }, []);

  useEffect(() => { localStorage.setItem('gidax_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('gidax_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('gidax_profile', JSON.stringify(userProfile)); }, [userProfile]);

  // Analysis Function
  const analyzeProduct = useCallback((productData) => {
    const nutrition = productData.nutrition;
    const allAdditives = [...new Set([...productData.additives, ...extractAdditives(productData.ingredients)])];
    const healthScore = calculateHealthScore(nutrition, allAdditives, productData.nova_group);
    const gradeInfo = getGrade(healthScore);
    const alerts = [];
    const brandLower = productData.brand.toLowerCase();
    const ingredientsLower = productData.ingredients.toLowerCase();

    // Helal check
    if (userProfile.sensitivities.includes('helal')) {
      let status = 'halal', details = [];
      allAdditives.forEach(code => {
        const a = ADDITIVE_DATABASE[code];
        if (a?.halal === 'haram') { status = 'haram'; details.push(`${code}: Helal değil`); }
        else if (a?.halal === 'şüpheli' && status !== 'haram') { status = 'suspicious'; details.push(`${code}: Şüpheli`); }
      });
      if (SENSITIVITY_DATA.helal.haram_ingredients.some(i => ingredientsLower.includes(i))) { status = 'haram'; details.push('Haram içerik'); }
      
      if (status === 'haram') alerts.push({ type: 'helal', icon: '☪️', title: 'Helal Değil', message: details.join(', '), severity: 'danger' });
      else if (status === 'suspicious') alerts.push({ type: 'helal', icon: '☪️', title: 'Şüpheli İçerik', message: 'Kaynağı belirsiz katkı maddesi', severity: 'warning' });
      else alerts.push({ type: 'helal', icon: '☪️', title: 'Helal Uyumlu', message: 'Şüpheli içerik bulunamadı', severity: 'success' });
    }

    // Boykot check
    if (userProfile.sensitivities.includes('boykot') && SENSITIVITY_DATA.boykot.brands.some(b => brandLower.includes(b))) {
      alerts.push({ type: 'boykot', icon: '✊', title: 'Boykot Listesinde', message: 'Bu marka boykot listesinde', severity: 'danger' });
    }

    // Yerli check
    if (userProfile.sensitivities.includes('yerli')) {
      const isTurkish = SENSITIVITY_DATA.yerli.turkish_brands.some(b => brandLower.includes(b));
      alerts.push({ type: 'yerli', icon: '🇹🇷', title: isTurkish ? 'Yerli Üretim' : 'İthal Ürün', message: isTurkish ? 'Türk markası' : 'Yabancı kaynaklı', severity: isTurkish ? 'success' : 'warning' });
    }

    // Vegan check
    if (userProfile.sensitivities.includes('vegan')) {
      const hasAnimal = SENSITIVITY_DATA.vegan.animal_ingredients.some(i => ingredientsLower.includes(i));
      alerts.push({ type: 'vegan', icon: '🌱', title: hasAnimal ? 'Vegan Değil' : 'Vegan', message: hasAnimal ? 'Hayvansal içerik tespit edildi' : 'Hayvansal içerik yok', severity: hasAnimal ? 'danger' : 'success' });
    }

    // Allergen check
    const foundAllergens = checkAllergens(productData.ingredients, userProfile.allergies);
    foundAllergens.forEach(a => alerts.push({ type: 'alerji', icon: '⚠️', title: `${a.label} İçerir`, message: `Bu ürün ${a.label.toLowerCase()} içerir`, severity: 'danger' }));

    // Health conditions
    if (userProfile.diseases.includes('diyabet')) {
      if (nutrition.sugar > 10) alerts.push({ type: 'diyabet', icon: '🩸', title: 'Diyabet Uyarısı', message: `${nutrition.sugar}g şeker - kan şekerini yükseltir`, severity: 'danger' });
      else if (nutrition.sugar > 5) alerts.push({ type: 'diyabet', icon: '🩸', title: 'Diyabet Uyarısı', message: 'Orta düzey şeker', severity: 'warning' });
    }
    if (userProfile.diseases.includes('hipertansiyon') && nutrition.salt > 1) {
      alerts.push({ type: 'hipertansiyon', icon: '💓', title: 'Tansiyon Uyarısı', message: `${nutrition.salt}g tuz - tansiyonu yükseltebilir`, severity: 'danger' });
    }
    if (userProfile.diseases.includes('kolesterol') && nutrition.saturated_fat > 6) {
      alerts.push({ type: 'kolesterol', icon: '🫀', title: 'Kolesterol Uyarısı', message: `${nutrition.saturated_fat}g doymuş yağ`, severity: 'danger' });
    }

    // Personal analysis
    const dangerCount = alerts.filter(a => a.severity === 'danger').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    let suitability = 'suitable', suitabilityScore = healthScore;
    if (dangerCount > 0) { suitability = 'not_suitable'; suitabilityScore = Math.max(10, suitabilityScore - dangerCount * 20); }
    else if (warningCount > 1) { suitability = 'partially_suitable'; suitabilityScore = Math.max(30, suitabilityScore - warningCount * 10); }

    const concerns = [], benefits = [], recommendations = [];
    if (nutrition.sugar > NUTRIENT_THRESHOLDS.sugar.high) { concerns.push(`Yüksek şeker (${nutrition.sugar}g)`); recommendations.push('Şekersiz alternatif tercih edin'); }
    if (nutrition.saturated_fat > NUTRIENT_THRESHOLDS.saturated_fat.high) { concerns.push(`Yüksek doymuş yağ (${nutrition.saturated_fat}g)`); }
    if (nutrition.salt > NUTRIENT_THRESHOLDS.salt.high) { concerns.push(`Yüksek tuz (${nutrition.salt}g)`); }
    if (productData.nova_group === 4) { concerns.push('Ultra işlenmiş gıda'); recommendations.push('Daha az işlenmiş alternatif düşünün'); }
    if (nutrition.protein > NUTRIENT_THRESHOLDS.protein.high) benefits.push(`Yüksek protein (${nutrition.protein}g)`);
    if (nutrition.fiber > NUTRIENT_THRESHOLDS.fiber.medium) benefits.push(`İyi lif kaynağı (${nutrition.fiber}g)`);
    if (productData.nova_group === 1) benefits.push('İşlenmemiş, doğal gıda');

    const alternatives = (ALTERNATIVES_DB[productData.category] || []).filter(a => a.health_score > healthScore).map(a => ({ ...a, improvement: `+${a.health_score - healthScore} puan` }));
    const additiveDetails = allAdditives.map(code => ({ code, ...(ADDITIVE_DATABASE[code] || { name: 'Bilinmeyen', risk: 50, category: 'Bilinmiyor', halal: 'bilinmiyor' }) }));

    return {
      product: { name: productData.name, brand: productData.brand, category: productData.category, serving_size: productData.serving_size, image_url: productData.image },
      scores: { health_score: { value: healthScore, grade: gradeInfo.grade, label: gradeInfo.label, color: gradeInfo.color }, nutri_score: productData.nutri_score, nova_group: { value: productData.nova_group, label: getNovaLabel(productData.nova_group) } },
      nutrition: {
        per_100g: {
          energy: { value: nutrition.energy, unit: 'kcal' },
          protein: { value: nutrition.protein, unit: 'g', ...getNutrientLevel('protein', nutrition.protein) },
          carbohydrates: { value: nutrition.carbohydrates, unit: 'g' },
          sugar: { value: nutrition.sugar, unit: 'g', ...getNutrientLevel('sugar', nutrition.sugar) },
          fat: { value: nutrition.fat, unit: 'g', ...getNutrientLevel('fat', nutrition.fat) },
          saturated_fat: { value: nutrition.saturated_fat, unit: 'g', ...getNutrientLevel('saturated_fat', nutrition.saturated_fat) },
          fiber: { value: nutrition.fiber, unit: 'g', ...getNutrientLevel('fiber', nutrition.fiber) },
          salt: { value: nutrition.salt, unit: 'g', ...getNutrientLevel('salt', nutrition.salt) }
        },
        raw: nutrition
      },
      ingredients: { raw_text: productData.ingredients, additives_list: allAdditives, additives_details: additiveDetails, allergens_found: foundAllergens },
      sensitivity_alerts: alerts,
      personal_analysis: { suitability, suitability_score: suitabilityScore, summary: suitability === 'not_suitable' ? 'Bu ürün sizin için uygun değil.' : suitability === 'partially_suitable' ? 'Dikkatli tüketmeniz önerilir.' : 'Bu ürün sizin için uygundur.', recommendations, benefits, concerns },
      alternatives,
      metadata: { data_source: 'local_db', confidence: 0.95, analyzed_at: new Date().toISOString() }
    };
  }, [userProfile]);

  // Handlers
  const handleScan = async () => {
    if (!barcode.trim()) return;
    setIsAnalyzing(true);
    setScanStatus('Open Food Facts aranıyor...');
    
    try {
      const offResult = await fetchProductByBarcode(barcode);
      if (offResult.success) {
        const r = analyzeProduct(offResult.product);
        setResult(r);
        setShowResult(true);
        setHistory(prev => [{ id: Date.now(), barcode, product: r.product, health_score: r.scores.health_score.value, timestamp: new Date().toISOString() }, ...prev.slice(0, 49)]);
      } else {
        const localProduct = SAMPLE_PRODUCTS[barcode];
        if (localProduct) {
          const r = analyzeProduct(localProduct);
          setResult(r);
          setShowResult(true);
          setHistory(prev => [{ id: Date.now(), barcode, product: r.product, health_score: r.scores.health_score.value, timestamp: new Date().toISOString() }, ...prev.slice(0, 49)]);
        } else {
          alert('Ürün bulunamadı. Kamera ile tarayın.');
        }
      }
    } catch (error) {
      alert('Arama hatası oluştu.');
    }
    setIsAnalyzing(false);
    setScanStatus('');
  };

  const handleBarcodeDetected = async (detectedBarcode) => {
    setShowScanner(false);
    setBarcode(detectedBarcode);
    setIsAnalyzing(true);
    setScanStatus('Barkod bulundu! Aranıyor...');
    
    try {
      const offResult = await fetchProductByBarcode(detectedBarcode);
      if (offResult.success) {
        const r = analyzeProduct(offResult.product);
        setResult(r);
        setShowResult(true);
        setHistory(prev => [{ id: Date.now(), barcode: detectedBarcode, product: r.product, health_score: r.scores.health_score.value, timestamp: new Date().toISOString() }, ...prev.slice(0, 49)]);
      } else {
        alert('Ürün bulunamadı. Fotoğraf çekerek AI analizi yapın.');
      }
    } catch (error) {
      alert('Arama hatası.');
    }
    setIsAnalyzing(false);
    setScanStatus('');
  };

  const handleImageCaptured = async (imageBase64) => {
    setShowScanner(false);
    setIsAnalyzing(true);
    setScanStatus('AI analiz yapılıyor...');
    
    try {
      const aiResult = await analyzeImageWithClaude(imageBase64);
      if (aiResult.success) {
        const r = analyzeProduct(aiResult.product);
        setResult(r);
        setShowResult(true);
        setHistory(prev => [{ id: Date.now(), barcode: 'AI', product: r.product, health_score: r.scores.health_score.value, timestamp: new Date().toISOString() }, ...prev.slice(0, 49)]);
      } else {
        alert(aiResult.error || 'Analiz başarısız.');
      }
    } catch (error) {
      alert('AI analiz hatası.');
    }
    setIsAnalyzing(false);
    setScanStatus('');
  };

  const handleQuickScan = async (id) => {
    setBarcode(id);
    setIsAnalyzing(true);
    setPortionCount(1);
    
    try {
      const offResult = await fetchProductByBarcode(id);
      if (offResult.success) {
        const r = analyzeProduct(offResult.product);
        setResult(r);
        setShowResult(true);
        setHistory(prev => [{ id: Date.now(), barcode: id, product: r.product, health_score: r.scores.health_score.value, timestamp: new Date().toISOString() }, ...prev.slice(0, 49)]);
      } else {
        const localProduct = SAMPLE_PRODUCTS[id];
        if (localProduct) {
          const r = analyzeProduct(localProduct);
          setResult(r);
          setShowResult(true);
          setHistory(prev => [{ id: Date.now(), barcode: id, product: r.product, health_score: r.scores.health_score.value, timestamp: new Date().toISOString() }, ...prev.slice(0, 49)]);
        }
      }
    } catch (error) {
      const localProduct = SAMPLE_PRODUCTS[id];
      if (localProduct) {
        const r = analyzeProduct(localProduct);
        setResult(r);
        setShowResult(true);
      }
    }
    setIsAnalyzing(false);
  };

  const toggleFavorite = (product) => {
    const isFav = favorites.some(f => f.name === product.name && f.brand === product.brand);
    if (isFav) setFavorites(prev => prev.filter(f => !(f.name === product.name && f.brand === product.brand)));
    else setFavorites(prev => [...prev, { ...product, addedAt: new Date().toISOString() }]);
  };

  const isFavorite = (product) => favorites.some(f => f.name === product?.name && f.brand === product?.brand);
  const portionNutrition = result ? calculatePortionNutrition(result.nutrition.raw, result.product.serving_size, portionCount) : null;


  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Apple className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">GidaX</h1>
              <p className="text-[10px] text-slate-500">AI Gıda Analizi v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showResult && (
              <button onClick={() => toggleFavorite(result.product)} className={`p-2 rounded-xl transition-all ${isFavorite(result?.product) ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-slate-400'}`}>
                <Heart className={`w-5 h-5 ${isFavorite(result?.product) ? 'fill-current' : ''}`} />
              </button>
            )}
            <button onClick={() => setShowProfileEdit(!showProfileEdit)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <Activity className="w-5 h-5 text-emerald-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileEdit(false)}>
          <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl border border-white/10 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" />Sağlık Profilim</h3>
              <button onClick={() => setShowProfileEdit(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-400 mb-3 block">Sağlık Durumları</label>
                <div className="flex flex-wrap gap-2">
                  {['diyabet', 'hipertansiyon', 'kolesterol', 'kalp', 'böbrek'].map(d => (
                    <button key={d} onClick={() => setUserProfile(p => ({ ...p, diseases: p.diseases.includes(d) ? p.diseases.filter(x => x !== d) : [...p.diseases, d] }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${userProfile.diseases.includes(d) ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50' : 'bg-white/5 text-slate-400'}`}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400 mb-3 block">Hassasiyetler</label>
                <div className="flex flex-wrap gap-2">
                  {[{ id: 'helal', icon: '☪️', label: 'Helal' }, { id: 'boykot', icon: '✊', label: 'Boykot' }, { id: 'yerli', icon: '🇹🇷', label: 'Yerli' }, { id: 'vegan', icon: '🌱', label: 'Vegan' }].map(s => (
                    <button key={s.id} onClick={() => setUserProfile(p => ({ ...p, sensitivities: p.sensitivities.includes(s.id) ? p.sensitivities.filter(x => x !== s.id) : [...p.sensitivities, s.id] }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${userProfile.sensitivities.includes(s.id) ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' : 'bg-white/5 text-slate-400'}`}>
                      <span>{s.icon}</span><span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400 mb-3 block">Alerjiler</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ALLERGENS).map(([key, a]) => (
                    <button key={key} onClick={() => setUserProfile(p => ({ ...p, allergies: p.allergies.includes(key) ? p.allergies.filter(x => x !== key) : [...p.allergies, key] }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${userProfile.allergies.includes(key) ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50' : 'bg-white/5 text-slate-400'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additive Modal */}
      {selectedAdditive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAdditive(null)}>
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-mono text-slate-500">{selectedAdditive.code}</span>
                <h3 className="font-bold text-lg">{selectedAdditive.name}</h3>
                <span className="text-sm text-slate-400">{selectedAdditive.category}</span>
              </div>
              <button onClick={() => setSelectedAdditive(null)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Risk Seviyesi</p>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${selectedAdditive.risk < 30 ? 'bg-emerald-500' : selectedAdditive.risk < 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${selectedAdditive.risk}%` }} />
                </div>
                <p className="text-right text-sm mt-1"><span className={selectedAdditive.risk < 30 ? 'text-emerald-400' : selectedAdditive.risk < 60 ? 'text-amber-400' : 'text-red-400'}>{selectedAdditive.risk}/100</span></p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Helal Durumu</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${selectedAdditive.halal === 'halal' ? 'bg-emerald-500/20 text-emerald-400' : selectedAdditive.halal === 'haram' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  ☪️ {selectedAdditive.halal === 'halal' ? 'Helal' : selectedAdditive.halal === 'haram' ? 'Helal Değil' : 'Şüpheli'}
                </span>
              </div>
              {selectedAdditive.concern && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-400 flex items-start gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{selectedAdditive.concern}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 px-4 py-4 pb-28 max-w-lg mx-auto">

        {/* Scan View */}
        {activeView === 'scan' && !showResult && (
          <div className="space-y-4">
            {/* Main Scan Button */}
            <button
              onClick={() => setShowScanner(true)}
              className="w-full aspect-[4/3] rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 flex flex-col items-center justify-center gap-4 transition-all"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-emerald-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <ScanLine className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">Ürün Tara</p>
                <p className="text-sm text-slate-400 mt-1">Barkod okur veya AI ile analiz eder</p>
              </div>
            </button>

            {/* Manual Barcode Input */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10">
              <p className="text-sm text-slate-400 mb-3">veya barkod numarası girin:</p>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={barcode} 
                  onChange={(e) => setBarcode(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()} 
                  placeholder="8690504055020"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                />
                <button 
                  onClick={handleScan} 
                  disabled={!barcode || isAnalyzing} 
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
              {scanStatus && <p className="text-xs text-emerald-400 mt-2">{scanStatus}</p>}
            </div>

            {/* Quick Test */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3 px-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />Hızlı Test
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(SAMPLE_PRODUCTS).slice(0, 6).map(([id, product]) => {
                  const score = calculateHealthScore(product.nutrition, product.additives, product.nova_group);
                  const grade = getGrade(score);
                  return (
                    <button 
                      key={id} 
                      onClick={() => handleQuickScan(id)} 
                      disabled={isAnalyzing}
                      className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-emerald-500/30 transition-all text-left relative"
                    >
                      <div className="absolute top-3 right-3">
                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: grade.color + '20', color: grade.color }}>{grade.grade}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl ${product.nova_group === 1 ? 'bg-emerald-500/20' : product.nova_group === 4 ? 'bg-red-500/10' : 'bg-amber-500/20'}`}>
                          {product.category === 'İçecek' ? <Coffee className="w-4 h-4 text-slate-300" /> : product.category === 'Süt Ürünü' ? <Milk className="w-4 h-4 text-slate-300" /> : <Cookie className="w-4 h-4 text-slate-300" />}
                        </div>
                        <div className="min-w-0 flex-1 pr-8">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.brand}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-cyan-400 mb-1">Akıllı Tarama</p>
                  <p className="text-slate-400">Barkod bulamazsa otomatik olarak Claude AI ile görsel analiz yapar.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {showScanner && (
          <BarcodeScanner
            onBarcodeDetected={handleBarcodeDetected}
            onImageCaptured={handleImageCaptured}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* Results View */}
        {activeView === 'scan' && showResult && result && (
          <div className="space-y-4">
            <button onClick={() => { setShowResult(false); setResult(null); setBarcode(''); setPortionCount(1); }} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2">
              <ChevronRight className="w-4 h-4 rotate-180" /><span className="text-sm">Yeni Tarama</span>
            </button>

            {/* Product Header */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-xl border border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {result.product.image_url ? <img src={result.product.image_url} alt={result.product.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{result.product.name}</h2>
                  <p className="text-slate-400">{result.product.brand}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-xs">{result.product.category}</span>
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-xs">{result.product.serving_size}</span>
                    {result.scores.nutri_score && <span className={`px-2 py-1 rounded-lg text-xs font-bold ${result.scores.nutri_score === 'A' ? 'bg-emerald-500/20 text-emerald-400' : result.scores.nutri_score === 'E' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>Nutri-Score {result.scores.nutri_score}</span>}
                  </div>
                </div>
              </div>

              {/* Health Score */}
              <div className="mt-5 p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Sağlık Skoru</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold" style={{ color: result.scores.health_score.color }}>{result.scores.health_score.value}</span>
                      <span className="text-slate-600">/100</span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: result.scores.health_score.color }}>{result.scores.health_score.label}</p>
                  </div>
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black" style={{ background: `linear-gradient(135deg, ${result.scores.health_score.color}30, ${result.scores.health_score.color}10)`, color: result.scores.health_score.color }}>
                    {result.scores.health_score.grade}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-400">NOVA Grubu</span></div>
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${result.scores.nova_group.value === 1 ? 'bg-emerald-500' : result.scores.nova_group.value === 4 ? 'bg-red-500' : 'bg-amber-500'}`}>{result.scores.nova_group.value}</span>
                    <span className="text-sm">{result.scores.nova_group.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {result.sensitivity_alerts.length > 0 && (
              <div className="space-y-2">
                {result.sensitivity_alerts.map((alert, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${alert.severity === 'danger' ? 'bg-red-500/10 border-red-500/30' : alert.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{alert.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${alert.severity === 'danger' ? 'text-red-400' : alert.severity === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{alert.title}</p>
                        <p className="text-sm text-slate-300 mt-0.5">{alert.message}</p>
                      </div>
                      {alert.severity === 'danger' ? <XCircle className="w-5 h-5 text-red-400" /> : alert.severity === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Personal Analysis */}
            <div className={`p-4 rounded-2xl border ${result.personal_analysis.suitability === 'not_suitable' ? 'bg-red-500/10 border-red-500/30' : result.personal_analysis.suitability === 'partially_suitable' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
              <div className="flex items-center gap-3 mb-3">
                {result.personal_analysis.suitability === 'not_suitable' ? <ThumbsDown className="w-6 h-6 text-red-400" /> : result.personal_analysis.suitability === 'partially_suitable' ? <AlertCircle className="w-6 h-6 text-amber-400" /> : <ThumbsUp className="w-6 h-6 text-emerald-400" />}
                <div>
                  <p className={`font-semibold ${result.personal_analysis.suitability === 'not_suitable' ? 'text-red-400' : result.personal_analysis.suitability === 'partially_suitable' ? 'text-amber-400' : 'text-emerald-400'}`}>Kişisel Değerlendirme</p>
                  <p className="text-sm text-slate-300">{result.personal_analysis.summary}</p>
                </div>
              </div>
              {result.personal_analysis.concerns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-500 mb-2">Dikkat:</p>
                  <div className="flex flex-wrap gap-2">{result.personal_analysis.concerns.map((c, i) => <span key={i} className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400">{c}</span>)}</div>
                </div>
              )}
              {result.personal_analysis.benefits.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-500 mb-2">Faydaları:</p>
                  <div className="flex flex-wrap gap-2">{result.personal_analysis.benefits.map((b, i) => <span key={i} className="text-xs px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400">{b}</span>)}</div>
                </div>
              )}
            </div>

            {/* Portion Calculator */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Utensils className="w-5 h-5 text-cyan-400" /><span className="font-semibold">Porsiyon Hesaplama</span></div>
                <div className="flex items-center gap-3 bg-slate-900/60 rounded-xl p-1">
                  <button onClick={() => setPortionCount(Math.max(0.5, portionCount - 0.5))} className="p-2 rounded-lg hover:bg-white/10"><Minus className="w-4 h-4" /></button>
                  <span className="w-12 text-center font-bold">{portionCount}</span>
                  <button onClick={() => setPortionCount(Math.min(10, portionCount + 0.5))} className="p-2 rounded-lg hover:bg-white/10"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              {portionNutrition && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 rounded-xl bg-slate-900/50 text-center"><p className="text-xs text-slate-500">Kalori</p><p className="font-bold text-orange-400">{portionNutrition.energy}</p></div>
                  <div className="p-2 rounded-xl bg-slate-900/50 text-center"><p className="text-xs text-slate-500">Protein</p><p className="font-bold text-blue-400">{portionNutrition.protein}g</p></div>
                  <div className="p-2 rounded-xl bg-slate-900/50 text-center"><p className="text-xs text-slate-500">Şeker</p><p className="font-bold text-red-400">{portionNutrition.sugar}g</p></div>
                  <div className="p-2 rounded-xl bg-slate-900/50 text-center"><p className="text-xs text-slate-500">Yağ</p><p className="font-bold text-purple-400">{portionNutrition.fat}g</p></div>
                </div>
              )}
            </div>

            {/* Nutrition */}
            <div className="p-5 rounded-3xl bg-slate-800/50 border border-white/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" />Besin Değerleri <span className="text-slate-500 font-normal text-sm">(100g)</span></h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5"><span className="text-slate-400">Enerji</span><span className="font-medium">{result.nutrition.per_100g.energy.value} kcal</span></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-center"><p className="text-xs text-slate-400 mb-1">Protein</p><p className="font-bold text-blue-400">{result.nutrition.per_100g.protein.value}g</p></div>
                  <div className="p-3 rounded-xl bg-amber-500/10 text-center"><p className="text-xs text-slate-400 mb-1">Karbonhidrat</p><p className="font-bold text-amber-400">{result.nutrition.per_100g.carbohydrates.value}g</p></div>
                  <div className="p-3 rounded-xl bg-purple-500/10 text-center"><p className="text-xs text-slate-400 mb-1">Yağ</p><p className="font-bold text-purple-400">{result.nutrition.per_100g.fat.value}g</p></div>
                </div>
                <div className="space-y-2 mt-4">
                  {[{ key: 'sugar', label: 'Şeker', data: result.nutrition.per_100g.sugar }, { key: 'saturated_fat', label: 'Doymuş Yağ', data: result.nutrition.per_100g.saturated_fat }, { key: 'salt', label: 'Tuz', data: result.nutrition.per_100g.salt }, { key: 'fiber', label: 'Lif', data: result.nutrition.per_100g.fiber }].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50">
                      <div className="flex items-center gap-3"><span className="text-lg">{item.data.icon}</span><div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-slate-500">{item.data.value}g</p></div></div>
                      <span className={`text-sm font-medium ${item.data.color}`}>{item.data.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additives */}
            {result.ingredients.additives_details.length > 0 && (
              <div className="p-5 rounded-3xl bg-slate-800/50 border border-white/10">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400" />Katkı Maddeleri</h3>
                <div className="space-y-2">
                  {result.ingredients.additives_details.map((a, idx) => (
                    <button key={idx} onClick={() => setSelectedAdditive(a)} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900/70 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${a.risk < 30 ? 'bg-emerald-500' : a.risk < 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        <div><p className="text-sm font-medium">{a.code}</p><p className="text-xs text-slate-500">{a.name}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-lg ${a.halal === 'halal' ? 'bg-emerald-500/20 text-emerald-400' : a.halal === 'haram' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {a.halal === 'halal' ? '✓' : a.halal === 'haram' ? '✗' : '?'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients */}
            <div className="p-5 rounded-3xl bg-slate-800/50 border border-white/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Leaf className="w-5 h-5 text-emerald-400" />İçindekiler</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{result.ingredients.raw_text}</p>
            </div>

            {/* Alternatives */}
            {result.alternatives.length > 0 && (
              <div className="p-5 rounded-3xl bg-slate-800/50 border border-white/10">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" />Daha Sağlıklı Alternatifler</h3>
                <div className="space-y-3">
                  {result.alternatives.map((alt, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        {alt.is_turkish && <span className="text-lg">🇹🇷</span>}
                        <div><p className="font-medium">{alt.name}</p><p className="text-xs text-slate-500">{alt.brand}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">{alt.improvement}</p>
                        <p className="text-xs text-slate-500">{alt.key_benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Favorites View */}
        {activeView === 'favorites' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Heart className="w-6 h-6 text-rose-400" />Favorilerim</h2>
            {favorites.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-800/50 text-center">
                <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Henüz favori ürün eklemediniz</p>
                <p className="text-sm text-slate-500 mt-1">Analiz sonuçlarında ❤️ butonuna tıklayın</p>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map((fav, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center"><Package className="w-6 h-6 text-slate-500" /></div>
                      <div><p className="font-medium">{fav.name}</p><p className="text-sm text-slate-500">{fav.brand}</p></div>
                    </div>
                    <button onClick={() => toggleFavorite(fav)} className="p-2 rounded-xl bg-rose-500/20 text-rose-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History View */}
        {activeView === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="w-6 h-6 text-cyan-400" />Tarama Geçmişi</h2>
              {history.length > 0 && <button onClick={() => { if(confirm('Geçmişi sil?')) setHistory([]); }} className="text-sm text-red-400">Temizle</button>}
            </div>
            {history.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-800/50 text-center">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Tarama geçmişiniz boş</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 20).map((item, idx) => {
                  const grade = getGrade(item.health_score);
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: grade.color + '20', color: grade.color }}>{grade.grade}</div>
                        <div><p className="font-medium">{item.product.name}</p><p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleDateString('tr-TR')}</p></div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: grade.color }}>{item.health_score}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile View */}
        {activeView === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-400" />Profilim</h2>
            <div className="p-5 rounded-3xl bg-slate-800/50 border border-white/10 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-2">Sağlık Durumları</p>
                <div className="flex flex-wrap gap-2">{userProfile.diseases.map(d => <span key={d} className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-sm">{d}</span>)}</div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Hassasiyetler</p>
                <div className="flex flex-wrap gap-2">{userProfile.sensitivities.map(s => <span key={s} className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">{s}</span>)}</div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Alerjiler</p>
                <div className="flex flex-wrap gap-2">{userProfile.allergies.map(a => <span key={a} className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-sm">{ALLERGENS[a]?.label || a}</span>)}</div>
              </div>
              <button onClick={() => setShowProfileEdit(true)} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium">Profili Düzenle</button>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10">
              <p className="text-sm text-slate-400">İstatistikler</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="text-center"><p className="text-2xl font-bold text-cyan-400">{history.length}</p><p className="text-xs text-slate-500">Toplam Tarama</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-rose-400">{favorites.length}</p><p className="text-xs text-slate-500">Favori Ürün</p></div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Loading */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Apple className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <p className="mt-4 text-slate-300 font-medium">Analiz Ediliyor...</p>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-2">
        <div className="max-w-md mx-auto p-2 rounded-2xl bg-slate-800/80 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-around">
            <button onClick={() => { setActiveView('scan'); setShowResult(false); }} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${activeView === 'scan' ? 'text-emerald-400' : 'text-slate-400'}`}><Search className="w-5 h-5" /><span className="text-xs">Tara</span></button>
            <button onClick={() => setActiveView('favorites')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${activeView === 'favorites' ? 'text-rose-400' : 'text-slate-400'}`}><Heart className="w-5 h-5" /><span className="text-xs">Favoriler</span></button>
            <button onClick={() => setActiveView('history')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${activeView === 'history' ? 'text-cyan-400' : 'text-slate-400'}`}><Clock className="w-5 h-5" /><span className="text-xs">Geçmiş</span></button>
            <button onClick={() => setActiveView('profile')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${activeView === 'profile' ? 'text-emerald-400' : 'text-slate-400'}`}><ShieldCheck className="w-5 h-5" /><span className="text-xs">Profil</span></button>
          </div>
        </div>
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        .animate-in { animation: fadeSlideIn 0.4s ease-out; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
