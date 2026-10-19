export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const clampedIndex = Math.min(i, units.length - 1);
  const formatted = (bytes / Math.pow(1024, clampedIndex)).toFixed(
    clampedIndex === 0 ? 0 : 1
  );
  return `${formatted} ${units[clampedIndex]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (!bytesPerSecond || bytesPerSecond <= 0 || !isFinite(bytesPerSecond)) {
    return '0 B/s';
  }
  return `${formatFileSize(bytesPerSecond)}/s`;
}

export function formatETA(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
    return '--';
  }
  if (seconds === 0) {
    return '0s';
  }
  const s = Math.round(seconds);
  if (s < 60) {
    return `${s}s`;
  }
  const minutes = Math.floor(s / 60);
  const remSeconds = s % 60;
  if (minutes < 60) {
    return `${minutes}m ${remSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

export function formatCode(raw: string): string {
  if (!raw) return '';
  // Clean to alphanumeric uppercase, max 8 chars
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (clean.length > 4) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}

export function getFileCategory(
  mimeType: string = '',
  fileName: string = ''
): 'image' | 'video' | 'audio' | 'code' | 'archive' | 'document' | 'file' {
  const mime = (mimeType || '').toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('compressed') ||
    mime.includes('archive') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
  ) {
    return 'archive';
  }
  if (
    mime.includes('javascript') ||
    mime.includes('typescript') ||
    mime.includes('json') ||
    mime.includes('html') ||
    mime.includes('xml') ||
    ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'json', 'html', 'css'].includes(ext)
  ) {
    return 'code';
  }
  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('text') ||
    ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt', 'csv'].includes(ext)
  ) {
    return 'document';
  }

  return 'file';
}

export function getFileIcon(mimeType: string): string {
  const category = getFileCategory(mimeType);
  switch (category) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'archive':
      return 'archive';
    case 'code':
      return 'file-code';
    case 'document':
      return 'file-text';
    default:
      return 'file';
  }
}

