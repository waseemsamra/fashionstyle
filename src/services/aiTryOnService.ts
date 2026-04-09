/**
 * AI Virtual Try-On Service
 * Calls your backend which proxies to Hugging Face API
 * Backend can be deployed to Render.com, Railway, or AWS
 */

// Backend URL (set in Amplify env vars or defaults to localhost for dev)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const AI_TRYON_ENDPOINT = `${BACKEND_URL}/ai-tryon`;

interface TryOnResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  processingTime?: number;
}

interface TryOnProgress {
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
  progress?: number;
}

/**
 * Perform AI virtual try-on with user photo and garment image
 * @param userPhoto - User's photo (base64 or URL)
 * @param garmentImage - Clothing item image (base64 or URL)
 * @param garmentDescription - Optional description for better results
 * @param onProgress - Progress callback
 */
export async function performVirtualTryOn(
  userPhoto: string | File,
  garmentImage: string | File,
  garmentDescription?: string,
  onProgress?: (progress: TryOnProgress) => void
): Promise<TryOnResult> {
  const startTime = Date.now();

  try {
    onProgress?.({
      status: 'uploading',
      message: 'Preparing images for AI processing...',
      progress: 10,
    });

    // Convert images to base64
    const [userPhotoBase64, garmentBase64] = await Promise.all([
      convertToBase64(userPhoto),
      convertToBase64(garmentImage),
    ]);

    onProgress?.({
      status: 'processing',
      message: 'AI is analyzing your photo and garment...',
      progress: 30,
    });

    // Call backend endpoint
    const response = await fetch(AI_TRYON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPhoto: userPhotoBase64,
        garmentImage: garmentBase64,
        garmentDescription: garmentDescription || 'clothing item',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.imageUrl) {
      onProgress?.({
        status: 'complete',
        message: 'AI try-on complete!',
        progress: 100,
      });

      trackAPIUsage();
      return {
        success: true,
        imageUrl: result.imageUrl,
        processingTime: Date.now() - startTime,
      };
    } else {
      throw new Error(result.error || 'AI processing failed');
    }
  } catch (error) {
    console.error('Virtual try-on failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Convert File or URL to base64
 */
async function convertToBase64(input: string | File): Promise<string> {
  if (typeof input === 'string') {
    // If it's already a URL, return as-is
    if (input.startsWith('http') || input.startsWith('data:')) {
      return input;
    }
  }

  if (input instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  }

  return input;
}

/**
 * Check if AI try-on is configured (always true since we use Lambda)
 */
export function isAIConfigured(): boolean {
  return true; // Lambda handles API key server-side
}

/**
 * Get remaining API quota (estimated)
 * Free tier: 5,000 requests/month
 */
export function getAPIQuota(): { used: number; remaining: number; limit: number } {
  // Track usage in localStorage
  const usageKey = 'hf_api_usage';
  const usage = JSON.parse(localStorage.getItem(usageKey) || '{"count": 0, "resetDate": null}');

  // Reset counter monthly
  const resetDate = new Date(usage.resetDate);
  const now = new Date();
  if (!usage.resetDate || now > resetDate) {
    usage.count = 0;
    usage.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    localStorage.setItem(usageKey, JSON.stringify(usage));
  }

  return {
    used: usage.count,
    remaining: 5000 - usage.count,
    limit: 5000,
  };
}

/**
 * Track API usage
 */
export function trackAPIUsage(): void {
  const usageKey = 'hf_api_usage';
  const usage = JSON.parse(localStorage.getItem(usageKey) || '{"count": 0, "resetDate": null}');
  usage.count += 1;
  localStorage.setItem(usageKey, JSON.stringify(usage));
}
