/**
 * AI Virtual Try-On Lambda Handler
 * Proxies requests to Hugging Face API to avoid CORS issues
 * Deploy this to AWS Lambda and update your API Gateway
 */

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models';

// VTON Models (primary + fallback)
const VTON_MODELS = {
  primary: 'yisol/IDM-VTON',
  fallback: 'levihsu/OOTDiffusion',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { userPhoto, garmentImage, garmentDescription } = body;

    if (!userPhoto || !garmentImage) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Missing required fields: userPhoto, garmentImage',
        }),
      };
    }

    if (!HUGGING_FACE_API_KEY) {
      return {
        statusCode: 500,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Hugging Face API key not configured in Lambda environment',
        }),
      };
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
      console.warn('Primary model failed, trying fallback:', result.error);
      result = await tryWithModel(
        VTON_MODELS.fallback,
        userPhoto,
        garmentImage,
        garmentDescription
      );
    }

    return {
      statusCode: result.success ? 200 : 500,
      headers: getCorsHeaders(),
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};

/**
 * Try virtual try-on with a specific model
 */
async function tryWithModel(modelId, userPhoto, garmentImage, garmentDescription) {
  try {
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

    return {
      success: true,
      imageUrl: `data:image/png;base64,${base64Image}`,
    };
  } catch (error) {
    console.error(`Model ${modelId} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Model processing failed',
    };
  }
}

/**
 * Get CORS headers
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };
}
