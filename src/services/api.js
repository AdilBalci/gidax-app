// Open Food Facts API
const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2';

export const fetchProductByBarcode = async (barcode) => {
  try {
    const response = await fetch(`${OFF_API_BASE}/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 0 || !data.product) {
      return { success: false, error: 'Ürün bulunamadı' };
    }

    const product = data.product;
    
    // Parse nutrition values
    const nutriments = product.nutriments || {};
    
    const parsedProduct = {
      name: product.product_name_tr || product.product_name || 'Bilinmeyen Ürün',
      brand: product.brands || 'Bilinmeyen Marka',
      category: parseCategory(product.categories_tags),
      serving_size: product.serving_size || '100g',
      image: product.image_front_url || product.image_url || null,
      nutrition: {
        energy: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
        protein: parseFloat(nutriments.proteins_100g || 0).toFixed(1),
        carbohydrates: parseFloat(nutriments.carbohydrates_100g || 0).toFixed(1),
        sugar: parseFloat(nutriments.sugars_100g || 0).toFixed(1),
        fat: parseFloat(nutriments.fat_100g || 0).toFixed(1),
        saturated_fat: parseFloat(nutriments['saturated-fat_100g'] || 0).toFixed(1),
        fiber: parseFloat(nutriments.fiber_100g || 0).toFixed(1),
        salt: parseFloat(nutriments.salt_100g || 0).toFixed(2),
      },
      ingredients: product.ingredients_text_tr || product.ingredients_text || '',
      additives: parseAdditives(product.additives_tags),
      nova_group: product.nova_group || 3,
      nutri_score: product.nutriscore_grade?.toUpperCase() || null,
      allergens: product.allergens_tags || [],
      labels: product.labels_tags || [],
      origin: product.origins || product.manufacturing_places || '',
    };

    return { success: true, product: parsedProduct };
  } catch (error) {
    console.error('OFF API Error:', error);
    return { success: false, error: 'Bağlantı hatası' };
  }
};

const parseCategory = (categories) => {
  if (!categories || categories.length === 0) return 'Diğer';
  
  const categoryMap = {
    'beverages': 'İçecek',
    'drinks': 'İçecek',
    'sodas': 'İçecek',
    'waters': 'İçecek',
    'snacks': 'Atıştırmalık',
    'biscuits': 'Atıştırmalık',
    'chocolates': 'Atıştırmalık',
    'candies': 'Atıştırmalık',
    'chips': 'Atıştırmalık',
    'dairy': 'Süt Ürünü',
    'milks': 'Süt Ürünü',
    'cheeses': 'Süt Ürünü',
    'yogurts': 'Süt Ürünü',
    'cereals': 'Tahıl',
    'breads': 'Tahıl',
    'meats': 'Et Ürünü',
    'frozen': 'Dondurulmuş',
    'canned': 'Konserve',
  };

  for (const cat of categories) {
    const key = cat.replace('en:', '').toLowerCase();
    for (const [match, label] of Object.entries(categoryMap)) {
      if (key.includes(match)) return label;
    }
  }
  
  return 'Diğer';
};

const parseAdditives = (additivesTags) => {
  if (!additivesTags) return [];
  return additivesTags
    .map(tag => tag.replace('en:', '').toUpperCase())
    .filter(code => code.startsWith('E'));
};

// Claude AI Image Analysis
export const analyzeImageWithClaude = async (imageBase64) => {
  // Bu fonksiyon backend gerektirir (API key güvenliği için)
  // Şimdilik placeholder
  return {
    success: false,
    error: 'AI analizi yakında aktif olacak'
  };
};

export default { fetchProductByBarcode, analyzeImageWithClaude };
