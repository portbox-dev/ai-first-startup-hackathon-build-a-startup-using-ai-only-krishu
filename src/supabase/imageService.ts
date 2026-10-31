import { supabase, isSupabaseConfigured } from './client';

export interface UploadPhotoResult {
  success: boolean;
  url?: string;
  error?: string;
  isFallback?: boolean;
}

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

/**
 * Validates whether an image file meets size and format requirements.
 * Accepts JPEG, PNG, and WebP up to 5 MB.
 */
export const validatePhotoFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload a JPEG, PNG, or WebP photo.',
    };
  }
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`,
    };
  }
  return { valid: true };
};

/**
 * Validates whether an ID string conforms to a standard UUID format.
 */
export function isValidUuid(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)
  );
}

/**
 * Uploads a dish image to Supabase Storage bucket 'dish-images'.
 * 
 * Rules:
 * 1. When a valid cloud restaurant UUID is available and Supabase is configured,
 *    uploads to 'dish-images/<restaurant_uuid>/<timestamp>-<cleanFileName>'.
 * 2. When cloud configuration or a valid restaurant UUID is unavailable (or 'local'),
 *    skips cloud upload cleanly and uses the existing local Data URL fallback.
 * 3. Never uploads to an invalid 'local/' or 'general/' folder in the cloud.
 * 4. If cloud upload fails, gracefully falls back to local Data URL with diagnostic logging.
 */
export async function uploadDishPhoto(
  file: File,
  restaurantId?: string | null
): Promise<UploadPhotoResult> {
  const validation = validatePhotoFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const hasValidRestaurantUuid = isValidUuid(restaurantId);
  const canAttemptCloudUpload = Boolean(supabase && isSupabaseConfigured && hasValidRestaurantUuid);

  // 1. Attempt upload to Supabase Storage bucket 'dish-images' ONLY if we have a valid restaurant UUID
  if (canAttemptCloudUpload) {
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const cleanRestaurantId = (restaurantId as string).trim();
      const filePath = `${cleanRestaurantId}/${Date.now()}-${cleanFileName}`;

      const { data, error } = await supabase!.storage
        .from('dish-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (!error && data) {
        const { data: publicData } = supabase!.storage
          .from('dish-images')
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          return {
            success: true,
            url: publicData.publicUrl,
            isFallback: false,
          };
        }
      }

      if (error) {
        console.warn(
          `[SmartMenu Storage] Cloud upload failed (${error.message || 'unknown error'}). Falling back to local data URL.`
        );
      }
    } catch (err: any) {
      console.warn(
        '[SmartMenu Storage] Cloud storage exception, falling back to local data URL:',
        err?.message || err
      );
    }
  }

  // 2. Safe Fallback: Read as Data URL so image immediately renders in preview and saves with dish
  try {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      success: true,
      url: dataUrl,
      isFallback: true,
    };
  } catch {
    return { success: false, error: 'Could not read the selected photo file.' };
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read photo file'));
    reader.readAsDataURL(file);
  });
}
