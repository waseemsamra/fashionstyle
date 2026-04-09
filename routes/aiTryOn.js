/**
 * AI Virtual Try-On Route
 * Add this to your Express backend to handle AI try-on requests
 * This proxies requests to Hugging Face API (avoids CORS issues)
 */

import express from 'express';

const router = express.Router();

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models';

const VTON_MODELS = {
  primary: 'yisol/IDM-VTON',
  fallback: 'levihsu/OOTDiffusion',
};

// POST /ai-tryon
router.post('/', async (req, res) => {
  console.log('🤖 AI Try-On request received');

  try {
    const { userPhoto, garmentImage, garmentDescription } = req.body;

    if (!userPhoto || !garmentImage) {
      return res.status(400).json({
        error: 'Missing required fields: userPhoto, garmentImage',
      });
    }

    if (!HUGGING_FACE_API_KEY) {
      return res.status(500).json({
        error: 'Hugging Face API key not configured',
      });
    }

    // Try primary model first
    let result = await tryWithModel(
      VTON_MODELS.primary,
      userPhoto,
      garmentImage,
      garmentDescription
    );

    // If primary fails, try fallback
    if (!result.success) {
      console.warn('⚠️ Primary model failed, trying fallback:', result.error);
      result = await tryWithModel(
        VTON_MODELS.fallback,
        userPhoto,
        garmentImage,
        garmentDescription
      );
    }

    if (result.success) {
      console.log('✅ AI Try-On successful');
      return res.json(result);
    } else {
      console.error('❌ AI Try-On failed:', result.error);
      return res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ AI Try-On error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * Try virtual try-on with a specific model
 */
async function tryWithModel(modelId, userPhoto, garmentImage, garmentDescription) {
  try {
    console.log(`🔄 Calling Hugging Face model: ${modelId}`);

    const response = await fetch(`${HUGGING_FACE_API_URL}/${modelId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
        'x-wait-for-model': 'true',
      },
      body: JSON.stringify({
        inputs: {
          human_img: userPhoto,
          garm_img: garmentImage,
          garment_des: garmentDescription || 'clothing item',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API error: ${response.status} ${response.statusText}`
      );
    }

    // Model returns image as blob
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    console.log('✅ Model processing successful');

    return {
      success: true,
      imageUrl: `data:image/png;base64,${base64Image}`,
    };
  } catch (error) {
    console.error(`❌ Model ${modelId} failed:`, error.message);
    return {
      success: false,
      error: error.message || 'Model processing failed',
    };
  }
}

export default router;
