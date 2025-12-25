import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: `Bu gıda ürününün etiketini analiz et ve aşağıdaki JSON formatında yanıt ver. Sadece JSON döndür, başka bir şey yazma.

{
  "name": "Ürün adı",
  "brand": "Marka",
  "category": "Kategori (Atıştırmalık, İçecek, Süt Ürünü, vs.)",
  "serving_size": "Porsiyon (örn: 100g)",
  "nutrition": {
    "energy": sayı (kcal),
    "protein": sayı (g),
    "carbohydrates": sayı (g),
    "sugar": sayı (g),
    "fat": sayı (g),
    "saturated_fat": sayı (g),
    "fiber": sayı (g),
    "salt": sayı (g)
  },
  "ingredients": "İçindekiler metni",
  "additives": ["E kodu listesi"],
  "nova_group": sayı (1-4),
  "nutri_score": "A/B/C/D/E veya null"
}

Eğer bu bir gıda ürünü değilse veya etiket okunamıyorsa: {"error": "Gıda ürünü tespit edilemedi"}`
            }
          ]
        }
      ]
    });

    const content = response.content[0].text;
    
    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.error) {
          return res.status(200).json({ success: false, error: parsed.error });
        }
        
        return res.status(200).json({
          success: true,
          source: 'claude_ai',
          product: {
            ...parsed,
            image: null,
            additives: parsed.additives || [],
            nova_group: parsed.nova_group || 3,
            nutri_score: parsed.nutri_score || null
          }
        });
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
    }

    return res.status(200).json({ success: false, error: 'Ürün bilgisi çıkarılamadı' });

  } catch (error) {
    console.error('Claude API Error:', error);
    return res.status(500).json({ error: 'Analiz hatası: ' + error.message });
  }
}
