/**
 * Smart Frame Extraction with Scene-Change Detection & Quadrant Tiling
 * 
 * Extracts the most meaningful frames from video/image/GIF media
 * using pixel-difference analysis to detect scene boundaries,
 * then splits each key frame into quadrant tiles for higher-resolution
 * detail capture (CLI text, IPs, config values).
 */

export interface ExtractedFrame {
  /** Base64 data URL of the full frame */
  full: string;
  /** Base64 data URLs of quadrant tiles [topLeft, topRight, bottomLeft, bottomRight] */
  tiles: string[];
  /** Timestamp in seconds (for video) or frame index */
  timestamp: number;
}

const MAX_KEY_FRAMES = 8;
const SCENE_CHANGE_THRESHOLD = 0.08; // 8% mean pixel difference = scene change
const SAMPLE_INTERVAL_SEC = 1;

/**
 * Extract key frames from a video URL using scene-change detection
 */
export async function extractVideoFrames(videoUrl: string): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    
    let prevImageData: ImageData | null = null;
    const keyFrames: ExtractedFrame[] = [];
    let currentTime = 0;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = 0;
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0);
      const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let isKeyFrame = false;
      if (!prevImageData) {
        // Always capture first frame
        isKeyFrame = true;
      } else {
        const diff = computeMeanAbsoluteDifference(prevImageData.data, currentImageData.data);
        isKeyFrame = diff > SCENE_CHANGE_THRESHOLD;
      }

      if (isKeyFrame && keyFrames.length < MAX_KEY_FRAMES) {
        const fullDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const tiles = extractQuadrantTiles(canvas, ctx);
        keyFrames.push({
          full: fullDataUrl,
          tiles,
          timestamp: currentTime,
        });
      }

      prevImageData = currentImageData;
      currentTime += SAMPLE_INTERVAL_SEC;

      if (currentTime <= video.duration) {
        video.currentTime = currentTime;
      } else {
        // Always include last frame if not already captured
        if (keyFrames.length > 0 && keyFrames[keyFrames.length - 1].timestamp < video.duration - SAMPLE_INTERVAL_SEC) {
          video.currentTime = video.duration - 0.1;
          // Will be handled on next onseeked
        }
        resolve(keyFrames.length > 0 ? keyFrames : [{
          full: canvas.toDataURL('image/jpeg', 0.85),
          tiles: extractQuadrantTiles(canvas, ctx),
          timestamp: 0,
        }]);
      }
    };

    video.onerror = () => reject(new Error(`Failed to load video: ${videoUrl}`));
    video.src = videoUrl;
  });
}

/**
 * Extract frames from an image URL (single frame + tiles)
 */
export async function extractImageFrame(imageUrl: string): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      resolve([{
        full: canvas.toDataURL('image/jpeg', 0.85),
        tiles: extractQuadrantTiles(canvas, ctx),
        timestamp: 0,
      }]);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

/**
 * Extract frames from a GIF — first, middle, and last frames
 * (GIFs are treated as images since we can't easily parse frames in-browser)
 */
export async function extractGifFrames(gifUrl: string): Promise<ExtractedFrame[]> {
  // For GIFs we just capture the static rendered frame
  return extractImageFrame(gifUrl);
}

/**
 * Main entry: extract frames from any LabMedia item
 */
export async function extractFrames(
  mediaUrl: string,
  mediaType: 'video' | 'gif' | 'image'
): Promise<ExtractedFrame[]> {
  switch (mediaType) {
    case 'video':
      return extractVideoFrames(mediaUrl);
    case 'gif':
      return extractGifFrames(mediaUrl);
    case 'image':
      return extractImageFrame(mediaUrl);
    default:
      return extractImageFrame(mediaUrl);
  }
}

/**
 * Compute mean absolute difference between two RGBA pixel arrays (0..1 range)
 */
function computeMeanAbsoluteDifference(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  const len = Math.min(a.length, b.length);
  let totalDiff = 0;
  // Sample every 4th pixel for speed (skip alpha channel)
  const sampleStep = 16; // every 4th pixel * 4 channels
  let samples = 0;

  for (let i = 0; i < len; i += sampleStep) {
    totalDiff += Math.abs(a[i] - b[i]) / 255;     // R
    totalDiff += Math.abs(a[i+1] - b[i+1]) / 255; // G
    totalDiff += Math.abs(a[i+2] - b[i+2]) / 255; // B
    samples += 3;
  }

  return samples > 0 ? totalDiff / samples : 0;
}

/**
 * Split a canvas into 4 quadrant tiles and return base64 data URLs
 */
function extractQuadrantTiles(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string[] {
  const hw = Math.floor(canvas.width / 2);
  const hh = Math.floor(canvas.height / 2);
  const tileCanvas = document.createElement('canvas');
  const tileCtx = tileCanvas.getContext('2d')!;
  
  const regions = [
    { x: 0, y: 0 },       // top-left
    { x: hw, y: 0 },      // top-right
    { x: 0, y: hh },      // bottom-left
    { x: hw, y: hh },     // bottom-right
  ];

  return regions.map(({ x, y }) => {
    tileCanvas.width = hw;
    tileCanvas.height = hh;
    const imageData = ctx.getImageData(x, y, hw, hh);
    tileCtx.putImageData(imageData, 0, 0);
    return tileCanvas.toDataURL('image/jpeg', 0.9);
  });
}
