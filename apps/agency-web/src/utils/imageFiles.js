const DEFAULT_MAX_BYTES = 280 * 1024;
const DEFAULT_MAX_DIMENSION = 1440;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unable to read image.')); };
    img.src = url;
  });
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to optimise image.')), type, quality);
  });
}

export async function optimiseImageFile(file, { maxBytes = DEFAULT_MAX_BYTES, maxDimension = DEFAULT_MAX_DIMENSION } = {}) {
  if (!file || !String(file.type || '').startsWith('image/')) return file;
  if (file.size <= maxBytes && !/heic|heif/i.test(file.type || '')) return file;
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.82;
    let blob = await canvasBlob(canvas, 'image/jpeg', quality);
    while (blob.size > maxBytes && quality > 0.42) {
      quality -= 0.08;
      blob = await canvasBlob(canvas, 'image/jpeg', quality);
    }
    if (blob.size >= file.size && file.size <= maxBytes * 1.2) return file;
    const base = String(file.name || 'photo').replace(/\.[^.]+$/, '');
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified || Date.now() });
  } catch {
    return file;
  }
}

export async function optimiseImageFiles(files, options) {
  const output = [];
  for (const file of files || []) output.push(await optimiseImageFile(file, options));
  return output;
}

export function totalFileBytes(files) {
  return (files || []).reduce((sum, file) => sum + Number(file?.size || 0), 0);
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
