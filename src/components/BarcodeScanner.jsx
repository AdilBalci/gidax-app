import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, ScanLine, Upload, Sparkles } from 'lucide-react';

export default function BarcodeScanner({ onBarcodeDetected, onImageCaptured, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('barcode'); // 'barcode' or 'photo'
  const [capturedImage, setCapturedImage] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mode === 'barcode') {
      startScanner();
    }
    return () => stopScanner();
  }, [mode]);

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Barkod bulundu
          stopScanner();
          onBarcodeDetected(decodedText);
        },
        (errorMessage) => {
          // Tarama devam ediyor, hata yok
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Kamera açılamadı. Lütfen kamera izni verin.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Stop error:', err);
      }
    }
    setIsScanning(false);
  };

  const switchToPhotoMode = async () => {
    await stopScanner();
    setMode('photo');
  };

  const capturePhoto = async () => {
    if (html5QrCodeRef.current) {
      try {
        // Mevcut kamera görüntüsünü al
        const canvas = document.createElement('canvas');
        const video = document.querySelector('#barcode-reader video');
        if (video) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedImage(imageData);
          await stopScanner();
        }
      } catch (err) {
        console.error('Capture error:', err);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (capturedImage) {
      onImageCaptured(capturedImage);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    if (mode === 'barcode') {
      startScanner();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => { setMode('barcode'); setCapturedImage(null); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === 'barcode' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70'
              }`}
            >
              <ScanLine className="w-4 h-4 inline mr-1" />
              Barkod
            </button>
            <button
              onClick={switchToPhotoMode}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === 'photo' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-1" />
              Fotoğraf
            </button>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Scanner / Preview Area */}
      <div className="h-full flex flex-col items-center justify-center">
        {!capturedImage ? (
          <>
            {mode === 'barcode' && (
              <div className="relative w-full h-full">
                <div id="barcode-reader" ref={scannerRef} className="w-full h-full" />
                
                {/* Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-40 border-2 border-emerald-400 rounded-xl bg-transparent" 
                       style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                </div>

                {/* Instructions */}
                <div className="absolute bottom-32 left-0 right-0 text-center">
                  <p className="text-white/80 text-sm">Barkodu çerçevenin içine hizalayın</p>
                  {isScanning && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Taranıyor...</span>
                    </div>
                  )}
                </div>

                {/* Photo capture button */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Barkod Yok - Fotoğraf Çek
                  </button>
                </div>
              </div>
            )}

            {mode === 'photo' && (
              <div className="flex flex-col items-center gap-6 p-8">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-64 h-64 rounded-3xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-emerald-400 transition-all"
                >
                  <Upload className="w-16 h-16 text-white/50" />
                  <p className="text-white/70 text-center">Galeriden fotoğraf seç<br />veya tıkla</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => setMode('barcode')}
                  className="px-6 py-3 rounded-full bg-emerald-500 text-white font-medium flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Kamera ile Çek
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Image Preview */}
            <div className="flex-1 flex items-center justify-center p-4">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="max-w-full max-h-[60vh] rounded-2xl object-contain"
              />
            </div>

            {/* Actions */}
            <div className="p-6 space-y-4">
              <button
                onClick={handleAnalyze}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                AI ile Analiz Et
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={resetCapture}
                  className="py-3 rounded-xl bg-white/10 text-white font-medium"
                >
                  Tekrar Çek
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 rounded-xl bg-white/10 text-white font-medium"
                >
                  Galeriden Seç
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="absolute top-20 left-4 right-4 p-4 rounded-xl bg-red-500/90 text-white text-center">
          {error}
        </div>
      )}
    </div>
  );
}
