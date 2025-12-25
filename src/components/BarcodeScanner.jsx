import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, ScanLine, Upload, Sparkles, ImageIcon } from 'lucide-react';

export default function BarcodeScanner({ onBarcodeDetected, onImageCaptured, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('barcode');
  const [capturedImage, setCapturedImage] = useState(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mode === 'barcode' && !capturedImage) {
      startScanner();
    }
    return () => stopScanner();
  }, [mode, capturedImage]);

  const startScanner = async () => {
    try {
      setError(null);
      
      // Önce eski scanner'ı temizle
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (e) {}
      }

      html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      
      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          return { width: Math.floor(minEdge * 0.8), height: Math.floor(minEdge * 0.4) };
        },
        aspectRatio: window.innerHeight / window.innerWidth,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          stopScanner();
          onBarcodeDetected(decodedText);
        },
        () => {}
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Kamera açılamadı. Lütfen kamera izni verin.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {}
    }
    setIsScanning(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Barkod dosyasından okuma dene
      if (mode === 'barcode' && html5QrCodeRef.current) {
        html5QrCodeRef.current.scanFile(file, true)
          .then(decodedText => {
            onBarcodeDetected(decodedText);
          })
          .catch(() => {
            // Barkod bulunamadı, görsel olarak kaydet
            const reader = new FileReader();
            reader.onloadend = () => setCapturedImage(reader.result);
            reader.readAsDataURL(file);
          });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setCapturedImage(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAnalyze = () => {
    if (capturedImage) {
      onImageCaptured(capturedImage);
    }
  };

  const resetCapture = async () => {
    setCapturedImage(null);
    if (mode === 'barcode') {
      setTimeout(() => startScanner(), 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-b from-black to-transparent absolute top-0 left-0 right-0 z-20">
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
              onClick={() => { stopScanner(); setMode('photo'); }}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!capturedImage ? (
          <>
            {mode === 'barcode' && (
              <div className="flex-1 relative">
                {/* Scanner Container - Tam ekran */}
                <div 
                  id="barcode-reader" 
                  className="absolute inset-0"
                  style={{ 
                    width: '100%', 
                    height: '100%',
                  }}
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  {/* Corner markers */}
                  <div className="relative w-72 h-44">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" 
                         style={{ top: '50%', animation: 'scan 2s ease-in-out infinite' }} />
                  </div>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-32 left-0 right-0 text-center px-4">
                  <p className="text-white text-base font-medium">Barkodu çerçevenin içine hizalayın</p>
                  {isScanning && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Taranıyor...</span>
                    </div>
                  )}
                </div>

                {/* Bottom buttons */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 px-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 max-w-[200px] py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white font-medium flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-5 h-5" />
                    Galeriden
                  </button>
                </div>
              </div>
            )}

            {mode === 'photo' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 pt-24">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-72 h-72 rounded-3xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-emerald-400 transition-all bg-white/5"
                >
                  <Upload className="w-16 h-16 text-white/50" />
                  <p className="text-white/70 text-center px-4">Ürün etiketinin fotoğrafını seçin</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col pt-20">
            {/* Image Preview */}
            <div className="flex-1 flex items-center justify-center p-4">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="max-w-full max-h-[55vh] rounded-2xl object-contain border border-white/10"
              />
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 p-4 pb-8 space-y-3 bg-gradient-to-t from-black to-transparent">
              <button
                onClick={handleAnalyze}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30"
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
                  Başka Seç
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error */}
      {error && (
        <div className="absolute top-20 left-4 right-4 p-4 rounded-xl bg-red-500/90 text-white text-center z-30">
          {error}
        </div>
      )}

      {/* Custom CSS for scan animation */}
      <style>{`
        #barcode-reader {
          border: none !important;
          width: 100vw !important;
          height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
        }
        #barcode-reader video {
          width: 100vw !important;
          height: 100vh !important;
          object-fit: cover !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
        }
        #barcode-reader__scan_region {
          background: transparent !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
        }
        #barcode-reader__scan_region video {
          width: 100vw !important;
          height: 100vh !important;
          object-fit: cover !important;
        }
        #barcode-reader__dashboard {
          display: none !important;
        }
        #barcode-reader__scan_region > br,
        #barcode-reader img,
        #barcode-reader__dashboard_section,
        #barcode-reader__dashboard_section_csr,
        #barcode-reader__dashboard_section_swaplink {
          display: none !important;
        }
        #qr-shaded-region {
          display: none !important;
        }
        @keyframes scan {
          0%, 100% { transform: translateY(-50px); opacity: 0; }
          50% { transform: translateY(50px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
