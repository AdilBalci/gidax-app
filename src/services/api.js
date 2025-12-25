// ============================================
// OPEN FOOD FACTS API
// ============================================
export const fetchProductByBarcode = async (barcode) => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      const p = data.product;
      return {
        success: true,
        source: 'openfoodfacts',
        product: {
          name: p.product_name_tr || p.product_name || 'Bilinmeyen Ürün',
          brand: p.brands || 'Bilinmeyen Marka',
          category: p.categories_tags?.[0]?.replace('en:', '') || 'Gıda',
          serving_size: p.serving_size || '100g',
          image: p.image_front_url || p.image_url || null,
          nutrition: {
            energy: p.nutriments?.['energy-kcal_100g'] || p.nutriments?.energy_100g || 0,
            protein: p.nutriments?.proteins_100g || 0,
            carbohydrates: p.nutriments?.carbohydrates_100g || 0,
            sugar: p.nutriments?.sugars_100g || 0,
            fat: p.nutriments?.fat_100g || 0,
            saturated_fat: p.nutriments?.['saturated-fat_100g'] || 0,
            fiber: p.nutriments?.fiber_100g || 0,
            salt: p.nutriments?.salt_100g || 0
          },
          ingredients: p.ingredients_text_tr || p.ingredients_text || '',
          additives: p.additives_tags?.map(a => a.replace('en:', '').toUpperCase()) || [],
          nova_group: p.nova_group || 3,
          nutri_score: p.nutriscore_grade?.toUpperCase() || null,
          allergens: p.allergens_tags || []
        }
      };
    }
    
    return { success: false, error: 'Ürün bulunamadı' };
  } catch (error) {
    console.error('Open Food Facts API Error:', error);
    return { success: false, error: 'API bağlantı hatası' };
  }
};

// ============================================
// CLAUDE AI - IMAGE ANALYSIS
// ============================================
export const analyzeImageWithClaude = async (imageBase64) => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    });
    
    if (!response.ok) throw new Error('API error');
    
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('Claude API Error:', error);
    return { success: false, error: 'Görsel analiz hatası' };
  }
};
