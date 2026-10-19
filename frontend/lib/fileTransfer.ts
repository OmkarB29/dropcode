import {
  FileManifestEntry,
  TransferProgress,
  DownloadedFile,
} from '@/types/transfer';
import {
  CHUNK_SIZE,
  MAX_BUFFERED_AMOUNT,
  BUFFERED_AMOUNT_LOW_THRESHOLD,
} from './constants';

export interface SendProgressCallback {
  (progress: TransferProgress): void;
}

export interface ReceiverCallbacks {
  onManifest?: (files: FileManifestEntry[]) => void;
  onProgress?: (progress: TransferProgress) => void;
  onFileComplete?: (file: DownloadedFile) => void;
  onTransferComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * Generate unique ID for files (crypto.randomUUID fallback)
 */
export function generateFileId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'file-' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

/**
 * Generate manifest for an array of Files
 */
export function createManifest(files: File[]): FileManifestEntry[] {
  return files.map((file) => ({
    id: generateFileId(),
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    chunkCount: Math.ceil(file.size / CHUNK_SIZE) || 1,
  }));
}

/**
 * Send files over RTCDataChannel with chunking, backpressure and progress tracking
 */
export async function sendFiles(
  dataChannel: RTCDataChannel,
  files: File[],
  onProgress: SendProgressCallback,
  checkCancelled?: () => boolean
): Promise<void> {
  if (dataChannel.readyState !== 'open') {
    throw new Error('DataChannel is not open');
  }

  dataChannel.binaryType = 'arraybuffer';
  dataChannel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW_THRESHOLD;

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  let totalBytesSent = 0;
  const startTime = Date.now();
  let lastSpeedSampleTime = startTime;
  let lastSpeedSampleBytes = 0;
  let currentSpeedBps = 0;

  // 1. Build and send manifest
  const manifest = createManifest(files);
  dataChannel.send(
    JSON.stringify({
      type: 'manifest',
      files: manifest,
    })
  );

  // Helper for backpressure waiting
  const waitForBufferDrain = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (dataChannel.bufferedAmount <= BUFFERED_AMOUNT_LOW_THRESHOLD) {
        resolve();
        return;
      }

      const onLow = () => {
        dataChannel.removeEventListener('bufferedamountlow', onLow);
        dataChannel.removeEventListener('close', onClose);
        dataChannel.removeEventListener('error', onError);
        resolve();
      };

      const onClose = () => {
        cleanup();
        reject(new Error('DataChannel closed during transfer'));
      };

      const onError = (e: Event) => {
        cleanup();
        reject(new Error(`DataChannel error: ${e}`));
      };

      const cleanup = () => {
        dataChannel.removeEventListener('bufferedamountlow', onLow);
        dataChannel.removeEventListener('close', onClose);
        dataChannel.removeEventListener('error', onError);
      };

      dataChannel.addEventListener('bufferedamountlow', onLow);
      dataChannel.addEventListener('close', onClose);
      dataChannel.addEventListener('error', onError);
    });
  };

  // Small delay so receiver prepares for stream
  await new Promise((r) => setTimeout(r, 100));

  // 2. Transfer each file
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    if (checkCancelled && checkCancelled()) {
      throw new Error('Transfer cancelled by user');
    }

    const file = files[fileIndex];
    const fileEntry = manifest[fileIndex];
    const fileId = fileEntry.id;
    let fileBytesSent = 0;

    // Send file-start control message
    dataChannel.send(
      JSON.stringify({
        type: 'file-start',
        fileId: fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      })
    );

    let offset = 0;
    while (offset < file.size) {
      if (checkCancelled && checkCancelled()) {
        throw new Error('Transfer cancelled by user');
      }

      if (dataChannel.readyState !== 'open') {
        throw new Error('DataChannel connection lost during transfer');
      }

      // Check backpressure
      if (dataChannel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
        await waitForBufferDrain();
      }

      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const slice = file.slice(offset, end);
      const arrayBuffer = await slice.arrayBuffer();

      dataChannel.send(arrayBuffer);

      const chunkSize = arrayBuffer.byteLength;
      offset += chunkSize;
      fileBytesSent += chunkSize;
      totalBytesSent += chunkSize;

      // Speed & ETA calculation every ~200ms
      const now = Date.now();
      const elapsedSinceSample = (now - lastSpeedSampleTime) / 1000;
      if (elapsedSinceSample >= 0.25 || offset >= file.size) {
        const bytesSinceSample = totalBytesSent - lastSpeedSampleBytes;
        const instantaneousSpeed = bytesSinceSample / elapsedSinceSample;
        currentSpeedBps =
          currentSpeedBps === 0
            ? instantaneousSpeed
            : currentSpeedBps * 0.7 + instantaneousSpeed * 0.3; // EWMA smooth

        lastSpeedSampleTime = now;
        lastSpeedSampleBytes = totalBytesSent;
      }

      const remainingBytes = Math.max(0, totalBytes - totalBytesSent);
      const eta = currentSpeedBps > 0 ? remainingBytes / currentSpeedBps : 0;

      const fileProgress = file.size > 0 ? Math.min(100, Math.round((fileBytesSent / file.size) * 100)) : 100;
      const overallProgress = totalBytes > 0 ? Math.min(100, Math.round((totalBytesSent / totalBytes) * 100)) : 100;

      onProgress({
        currentFileIndex: fileIndex,
        currentFileName: file.name,
        currentFileProgress: fileProgress,
        overallProgress: overallProgress,
        bytesTransferred: totalBytesSent,
        totalBytes: totalBytes,
        speedBps: currentSpeedBps,
        estimatedSecondsRemaining: eta,
      });
    }

    // Send file-end control message
    dataChannel.send(
      JSON.stringify({
        type: 'file-end',
        fileId: fileId,
      })
    );

    // Yield control loop briefly
    await new Promise((r) => setTimeout(r, 20));
  }

  // 3. Send transfer-complete message
  dataChannel.send(
    JSON.stringify({
      type: 'transfer-complete',
    })
  );

  // Final 100% progress update
  onProgress({
    currentFileIndex: files.length - 1,
    currentFileName: files[files.length - 1]?.name || '',
    currentFileProgress: 100,
    overallProgress: 100,
    bytesTransferred: totalBytes,
    totalBytes: totalBytes,
    speedBps: 0,
    estimatedSecondsRemaining: 0,
  });
}

/**
 * Setup receiver listeners on RTCDataChannel to reconstruct files
 */
export function receiveFiles(
  dataChannel: RTCDataChannel,
  callbacks: ReceiverCallbacks
): () => void {
  dataChannel.binaryType = 'arraybuffer';

  let manifest: FileManifestEntry[] = [];
  let currentFileEntry: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    chunks: ArrayBuffer[];
    receivedBytes: number;
  } | null = null;

  let totalBytes = 0;
  let totalBytesReceived = 0;
  let currentFileIndex = 0;
  const startTime = Date.now();
  let lastSampleTime = startTime;
  let lastSampleBytes = 0;
  let currentSpeedBps = 0;

  const handleMessage = (event: MessageEvent) => {
    try {
      if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);

        if (message.type === 'manifest') {
          manifest = message.files || [];
          totalBytes = manifest.reduce((acc, f) => acc + f.size, 0);
          currentFileIndex = 0;
          if (callbacks.onManifest) {
            callbacks.onManifest(manifest);
          }
        } else if (message.type === 'file-start') {
          currentFileEntry = {
            id: message.fileId,
            name: message.fileName,
            size: message.fileSize,
            mimeType: message.mimeType || 'application/octet-stream',
            chunks: [],
            receivedBytes: 0,
          };
          // Find matching index in manifest
          const idx = manifest.findIndex((m) => m.id === message.fileId);
          if (idx !== -1) {
            currentFileIndex = idx;
          }
        } else if (message.type === 'file-end') {
          if (currentFileEntry) {
            const blob = new Blob(currentFileEntry.chunks, {
              type: currentFileEntry.mimeType,
            });
            const downloadUrl = URL.createObjectURL(blob);
            const downloaded: DownloadedFile = {
              id: currentFileEntry.id,
              name: currentFileEntry.name,
              url: downloadUrl,
              size: currentFileEntry.size,
              mimeType: currentFileEntry.mimeType,
            };

            // Trigger auto-download
            try {
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.download = currentFileEntry.name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } catch (dlErr) {
              console.warn('Auto download triggered blocked or failed:', dlErr);
            }

            if (callbacks.onFileComplete) {
              callbacks.onFileComplete(downloaded);
            }

            currentFileEntry = null;
          }
        } else if (message.type === 'transfer-complete') {
          if (callbacks.onProgress) {
            callbacks.onProgress({
              currentFileIndex: Math.max(0, manifest.length - 1),
              currentFileName: manifest[manifest.length - 1]?.name || 'All files',
              currentFileProgress: 100,
              overallProgress: 100,
              bytesTransferred: totalBytes,
              totalBytes: totalBytes,
              speedBps: 0,
              estimatedSecondsRemaining: 0,
            });
          }

          if (callbacks.onTransferComplete) {
            callbacks.onTransferComplete();
          }
        }
      } else if (event.data instanceof ArrayBuffer) {
        const buffer = event.data;
        const chunkSize = buffer.byteLength;

        if (currentFileEntry) {
          currentFileEntry.chunks.push(buffer);
          currentFileEntry.receivedBytes += chunkSize;
        }

        totalBytesReceived += chunkSize;

        const now = Date.now();
        const elapsedSinceSample = (now - lastSampleTime) / 1000;
        if (elapsedSinceSample >= 0.25) {
          const bytesDiff = totalBytesReceived - lastSampleBytes;
          const instSpeed = bytesDiff / elapsedSinceSample;
          currentSpeedBps =
            currentSpeedBps === 0
              ? instSpeed
              : currentSpeedBps * 0.7 + instSpeed * 0.3;
          lastSampleTime = now;
          lastSampleBytes = totalBytesReceived;
        }

        const remainingBytes = Math.max(0, totalBytes - totalBytesReceived);
        const eta = currentSpeedBps > 0 ? remainingBytes / currentSpeedBps : 0;

        const currentFileSize = currentFileEntry ? currentFileEntry.size : 1;
        const currentFileBytes = currentFileEntry ? currentFileEntry.receivedBytes : 0;

        const fileProg =
          currentFileSize > 0
            ? Math.min(100, Math.round((currentFileBytes / currentFileSize) * 100))
            : 100;
        const overallProg =
          totalBytes > 0
            ? Math.min(100, Math.round((totalBytesReceived / totalBytes) * 100))
            : 100;

        if (callbacks.onProgress) {
          callbacks.onProgress({
            currentFileIndex: currentFileIndex,
            currentFileName: currentFileEntry?.name || 'Receiving...',
            currentFileProgress: fileProg,
            overallProgress: overallProg,
            bytesTransferred: totalBytesReceived,
            totalBytes: totalBytes,
            speedBps: currentSpeedBps,
            estimatedSecondsRemaining: eta,
          });
        }
      }
    } catch (err: any) {
      console.error('Error processing received chunk/message:', err);
      if (callbacks.onError) {
        callbacks.onError(err?.message || 'Data error');
      }
    }
  };

  dataChannel.addEventListener('message', handleMessage);

  return () => {
    dataChannel.removeEventListener('message', handleMessage);
  };
}

/**
 * Send files over WebSocket Relay (PairDrop-style fallback)
 */
export async function sendFilesViaSocket(
  socket: any,
  sessionId: string,
  files: File[],
  onProgress: SendProgressCallback,
  checkCancelled?: () => boolean
): Promise<void> {
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  let totalBytesSent = 0;
  const startTime = Date.now();
  let lastSpeedSampleTime = startTime;
  let lastSpeedSampleBytes = 0;
  let currentSpeedBps = 0;

  // 1. Build and send manifest
  const manifest = createManifest(files);
  socket.emit('relay:start', { sessionId, manifest });

  await new Promise((r) => setTimeout(r, 60));

  // 2. Transfer each file
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    if (checkCancelled && checkCancelled()) {
      throw new Error('Transfer cancelled by user');
    }

    const file = files[fileIndex];
    const fileEntry = manifest[fileIndex];
    let fileBytesSent = 0;

    socket.emit('relay:file-start', {
      sessionId,
      fileInfo: {
        fileId: fileEntry.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      },
    });

    let offset = 0;
    while (offset < file.size) {
      if (checkCancelled && checkCancelled()) {
        throw new Error('Transfer cancelled by user');
      }

      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const slice = file.slice(offset, end);
      const arrayBuffer = await slice.arrayBuffer();

      // Send chunk with ack backpressure (with safety timeout)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(); // Resolve to prevent freezing
        }, 5000);
        socket.emit('relay:chunk', { sessionId, chunk: arrayBuffer }, (res?: any) => {
          clearTimeout(timeout);
          if (res?.error) {
            reject(new Error(res.error));
          } else {
            resolve();
          }
        });
      });

      const chunkSize = arrayBuffer.byteLength;
      offset += chunkSize;
      fileBytesSent += chunkSize;
      totalBytesSent += chunkSize;

      const now = Date.now();
      const elapsedSinceSample = (now - lastSpeedSampleTime) / 1000;
      if (elapsedSinceSample >= 0.25 || offset >= file.size) {
        const bytesSinceSample = totalBytesSent - lastSpeedSampleBytes;
        const instantaneousSpeed = bytesSinceSample / elapsedSinceSample;
        currentSpeedBps =
          currentSpeedBps === 0
            ? instantaneousSpeed
            : currentSpeedBps * 0.7 + instantaneousSpeed * 0.3;

        lastSpeedSampleTime = now;
        lastSpeedSampleBytes = totalBytesSent;
      }

      const remainingBytes = Math.max(0, totalBytes - totalBytesSent);
      const eta = currentSpeedBps > 0 ? remainingBytes / currentSpeedBps : 0;
      const fileProgress = file.size > 0 ? Math.min(100, Math.round((fileBytesSent / file.size) * 100)) : 100;
      const overallProgress = totalBytes > 0 ? Math.min(100, Math.round((totalBytesSent / totalBytes) * 100)) : 100;

      onProgress({
        currentFileIndex: fileIndex,
        currentFileName: file.name,
        currentFileProgress: fileProgress,
        overallProgress: overallProgress,
        bytesTransferred: totalBytesSent,
        totalBytes: totalBytes,
        speedBps: currentSpeedBps,
        estimatedSecondsRemaining: eta,
      });
    }

    socket.emit('relay:file-end', { sessionId, fileId: fileEntry.id });
    await new Promise((r) => setTimeout(r, 20));
  }

  socket.emit('relay:complete', { sessionId });

  onProgress({
    currentFileIndex: files.length - 1,
    currentFileName: files[files.length - 1]?.name || '',
    currentFileProgress: 100,
    overallProgress: 100,
    bytesTransferred: totalBytes,
    totalBytes: totalBytes,
    speedBps: 0,
    estimatedSecondsRemaining: 0,
  });
}

/**
 * Receive files over WebSocket Relay (PairDrop-style fallback)
 */
export function receiveFilesViaSocket(
  socket: any,
  callbacks: ReceiverCallbacks
): () => void {
  let manifest: FileManifestEntry[] = [];
  let currentFileEntry: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    chunks: ArrayBuffer[];
    receivedBytes: number;
  } | null = null;

  let totalBytes = 0;
  let totalBytesReceived = 0;
  let currentFileIndex = 0;
  const startTime = Date.now();
  let lastSampleTime = startTime;
  let lastSampleBytes = 0;
  let currentSpeedBps = 0;

  const onRelayStart = (manifestData: FileManifestEntry[]) => {
    manifest = manifestData || [];
    totalBytes = manifest.reduce((acc, f) => acc + f.size, 0);
    currentFileIndex = 0;
    if (callbacks.onManifest) {
      callbacks.onManifest(manifest);
    }
  };

  const onRelayFileStart = (fileInfo: any) => {
    currentFileEntry = {
      id: fileInfo.fileId,
      name: fileInfo.fileName,
      size: fileInfo.fileSize,
      mimeType: fileInfo.mimeType || 'application/octet-stream',
      chunks: [],
      receivedBytes: 0,
    };
    const idx = manifest.findIndex((m) => m.id === fileInfo.fileId);
    if (idx !== -1) {
      currentFileIndex = idx;
    }
  };

  const onRelayChunk = async (rawChunk: any) => {
    if (!rawChunk) return;

    let chunk: ArrayBuffer;
    if (rawChunk instanceof ArrayBuffer) {
      chunk = rawChunk;
    } else if (ArrayBuffer.isView(rawChunk)) {
      chunk = rawChunk.buffer.slice(
        rawChunk.byteOffset,
        rawChunk.byteOffset + rawChunk.byteLength
      ) as ArrayBuffer;
    } else if (typeof Blob !== 'undefined' && rawChunk instanceof Blob) {
      chunk = await rawChunk.arrayBuffer();
    } else if (rawChunk.buffer instanceof ArrayBuffer) {
      chunk = rawChunk.buffer;
    } else {
      chunk = rawChunk as ArrayBuffer;
    }

    const chunkSize = chunk.byteLength || 0;
    if (currentFileEntry) {
      currentFileEntry.chunks.push(chunk);
      currentFileEntry.receivedBytes += chunkSize;
    }

    totalBytesReceived += chunkSize;

    const now = Date.now();
    const elapsedSinceSample = (now - lastSampleTime) / 1000;
    if (elapsedSinceSample >= 0.25) {
      const bytesDiff = totalBytesReceived - lastSampleBytes;
      const instSpeed = bytesDiff / elapsedSinceSample;
      currentSpeedBps =
        currentSpeedBps === 0
          ? instSpeed
          : currentSpeedBps * 0.7 + instSpeed * 0.3;
      lastSampleTime = now;
      lastSampleBytes = totalBytesReceived;
    }

    const remainingBytes = Math.max(0, totalBytes - totalBytesReceived);
    const eta = currentSpeedBps > 0 ? remainingBytes / currentSpeedBps : 0;
    const currentFileSize = currentFileEntry ? currentFileEntry.size : 1;
    const currentFileBytes = currentFileEntry ? currentFileEntry.receivedBytes : 0;

    const fileProg =
      currentFileSize > 0
        ? Math.min(100, Math.round((currentFileBytes / currentFileSize) * 100))
        : 100;
    const overallProg =
      totalBytes > 0
        ? Math.min(100, Math.round((totalBytesReceived / totalBytes) * 100))
        : 100;

    if (callbacks.onProgress) {
      callbacks.onProgress({
        currentFileIndex,
        currentFileName: currentFileEntry?.name || 'Receiving...',
        currentFileProgress: fileProg,
        overallProgress: overallProg,
        bytesTransferred: totalBytesReceived,
        totalBytes,
        speedBps: currentSpeedBps,
        estimatedSecondsRemaining: eta,
      });
    }
  };

  const onRelayFileEnd = () => {
    if (currentFileEntry) {
      const blob = new Blob(currentFileEntry.chunks, {
        type: currentFileEntry.mimeType,
      });
      const downloadUrl = URL.createObjectURL(blob);
      const downloaded: DownloadedFile = {
        id: currentFileEntry.id,
        name: currentFileEntry.name,
        url: downloadUrl,
        size: currentFileEntry.size,
        mimeType: currentFileEntry.mimeType,
      };

      try {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = currentFileEntry.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (dlErr) {
        console.warn('Auto download blocked:', dlErr);
      }

      if (callbacks.onFileComplete) {
        callbacks.onFileComplete(downloaded);
      }
      currentFileEntry = null;
    }
  };

  const onRelayComplete = () => {
    if (callbacks.onProgress) {
      callbacks.onProgress({
        currentFileIndex: Math.max(0, manifest.length - 1),
        currentFileName: manifest[manifest.length - 1]?.name || 'All files',
        currentFileProgress: 100,
        overallProgress: 100,
        bytesTransferred: totalBytes,
        totalBytes,
        speedBps: 0,
        estimatedSecondsRemaining: 0,
      });
    }
    if (callbacks.onTransferComplete) {
      callbacks.onTransferComplete();
    }
  };

  socket.on('relay:start', onRelayStart);
  socket.on('relay:file-start', onRelayFileStart);
  socket.on('relay:chunk', onRelayChunk);
  socket.on('relay:file-end', onRelayFileEnd);
  socket.on('relay:complete', onRelayComplete);

  return () => {
    socket.off('relay:start', onRelayStart);
    socket.off('relay:file-start', onRelayFileStart);
    socket.off('relay:chunk', onRelayChunk);
    socket.off('relay:file-end', onRelayFileEnd);
    socket.off('relay:complete', onRelayComplete);
  };
}
