import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Printer, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Smartphone, 
  Sparkles,
  Wifi,
  UtensilsCrossed,
  Info,
  CheckCircle2,
  X
} from 'lucide-react';
import { RestaurantInfo, ActiveView } from '../../types';

interface QRCodeTabProps {
  restaurant: RestaurantInfo;
  setActiveView: (view: ActiveView) => void;
}

export const QRCodeTab: React.FC<QRCodeTabProps> = ({ restaurant, setActiveView }) => {
  const [accentTheme, setAccentTheme] = useState<'teal' | 'obsidian' | 'saffron' | 'emerald'>('teal');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute the single complete public menu URL for the restaurant (including https://)
  const getMenuUrl = (): string => {
    try {
      const slug = restaurant.slug || restaurant.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'green-leaf-cafe';

      let origin = window.location.origin;
      // In Google AI Studio Build runtime, 'ais-dev-' URLs are private to the logged-in Google developer account.
      // The public, shared pre-release URL that allows unauthenticated Incognito access is 'ais-pre-'.
      if (origin && origin.includes('ais-dev-')) {
        origin = origin.replace('ais-dev-', 'ais-pre-');
      }

      const cleanPath = window.location.pathname.replace(/\/$/, '');
      const hashPart = `#/menu?restaurant=${encodeURIComponent(slug)}`;

      if (origin && origin !== 'null' && (origin.startsWith('http://') || origin.startsWith('https://'))) {
        return `${origin}${cleanPath}/${hashPart}`;
      }
      return `https://smartmenu.app/#/menu?restaurant=${encodeURIComponent(slug)}`;
    } catch {
      return `https://smartmenu.app/#/menu`;
    }
  };

  const menuUrl = getMenuUrl();

  // Generate real scannable QR Code whenever menuUrl changes
  useEffect(() => {
    let isCurrent = true;

    // Use error correction level M (15%) for crisp, reliable phone camera detection
    QRCode.toDataURL(menuUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#070d18', // Deep high-contrast dark navy
        light: '#ffffff', // Crisp pure white background
      },
    })
      .then((url) => {
        if (isCurrent) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });

    return () => {
      isCurrent = false;
    };
  }, [menuUrl]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(menuUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = menuUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      showToast('Menu URL copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast('Copied URL: ' + menuUrl);
    }
  };

  // Download high-resolution PNG stand card or raw QR code
  const handleDownloadPng = async (mode: 'stand' | 'qr-only' = 'stand') => {
    if (!qrDataUrl) return;
    setIsDownloading(true);

    try {
      if (mode === 'qr-only') {
        // Direct QR code download
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `${restaurant.name.toLowerCase().replace(/\s+/g, '-')}-menu-qr.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Menu QR Code downloaded as PNG!');
        setIsDownloading(false);
        return;
      }

      // Generate composite high-resolution display stand card (1000 x 1350 px)
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      // Background with sleek rounded border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Accent border
      const accentColor = 
        accentTheme === 'saffron' ? '#d97706' : 
        accentTheme === 'emerald' ? '#059669' : 
        accentTheme === 'obsidian' ? '#1e293b' : '#0d9488';
      
      ctx.lineWidth = 16;
      ctx.strokeStyle = accentColor;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Inner subtle border
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

      // Brand monogram circle
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(500, 150, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GL', 500, 150);

      // Restaurant Name
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 48px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(restaurant.name.toUpperCase(), 500, 240);

      // Tagline
      ctx.fillStyle = '#64748b';
      ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(restaurant.cuisine.toUpperCase(), 500, 285);

      // Official Menu Badge Box
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(340, 320, 320, 50);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(340, 320, 320, 50);

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('OFFICIAL DIGITAL MENU', 500, 347);

      // Load and draw the generated QR Code image onto canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = qrDataUrl;
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });

      // Draw QR Code centered (560 x 560)
      ctx.drawImage(img, 220, 410, 560, 560);

      // Instruction
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('SCAN TO VIEW OUR DIGITAL MENU', 500, 1030);

      ctx.fillStyle = '#64748b';
      ctx.font = '22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Open phone camera & tap the link · No sign-in or app required', 500, 1075);

      // Wi-Fi Details Box (800px wide, centered at 500 => x=100 to 900)
      const wifiBoxX = 100;
      const wifiBoxY = 1120;
      const wifiBoxW = 800;
      const wifiBoxH = 110;
      const wifiBoxR = 12;

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(wifiBoxX, wifiBoxY, wifiBoxW, wifiBoxH, wifiBoxR);
      } else {
        ctx.rect(wifiBoxX, wifiBoxY, wifiBoxW, wifiBoxH);
      }
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Line 1: Guest Wi-Fi Network Name
      const wifiLine1 = `FREE GUEST WI-FI: ${restaurant.wifiSsid || 'GreenLeaf_Guest'}`;
      let font1Size = 21;
      ctx.font = `bold ${font1Size}px "Plus Jakarta Sans", sans-serif`;
      while (ctx.measureText(wifiLine1).width > 740 && font1Size > 14) {
        font1Size -= 1;
        ctx.font = `bold ${font1Size}px "Plus Jakarta Sans", sans-serif`;
      }
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(wifiLine1, 500, wifiBoxY + 38);

      // Line 2: Password
      const wifiLine2 = `PASSWORD: ${restaurant.wifiPass || 'FreshBotanical2026'}`;
      let font2Size = 18;
      ctx.font = `600 ${font2Size}px "Plus Jakarta Sans", monospace`;
      while (ctx.measureText(wifiLine2).width > 740 && font2Size > 13) {
        font2Size -= 1;
        ctx.font = `600 ${font2Size}px "Plus Jakarta Sans", monospace`;
      }
      ctx.fillStyle = '#334155';
      ctx.fillText(wifiLine2, 500, wifiBoxY + 76);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Powered by SmartMenu · Instant Contactless Digital Dining', 500, 1280);

      // Trigger download
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${restaurant.name.toLowerCase().replace(/\s+/g, '-')}-digital-menu-stand.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(`Restaurant digital menu stand downloaded!`);
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download image. Try printing instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenPrintModal = () => {
    setIsPrintModalOpen(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm animate-in slide-in-from-top-4 duration-200 max-w-[calc(100vw-2rem)]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="break-words leading-tight">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-semibold mb-1.5 sm:mb-2 max-w-full">
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Single Restaurant QR Code</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight break-words">QR Code Studio</h1>
          <p className="text-xs text-slate-400 mt-0.5 break-words">
            Your single, permanent QR code linking guests directly to {restaurant.name}&apos;s live digital menu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('customer-menu')}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-teal-500/20"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Test Customer Menu</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start w-full">
        {/* Left Column: Public URL & Copy Controls */}
        <div className="lg:col-span-6 space-y-4 min-w-0">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-white">Encoded Public Menu URL</h3>
              <span className="text-[11px] text-teal-400 font-medium">Scans open this exact link</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={menuUrl}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-teal-300 min-w-0 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
                title="Copy menu URL to clipboard"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied URL!' : 'Copy Menu Link'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
              <span>Ready for table stands, counter cards & stickers</span>
              <button
                onClick={() => setActiveView('customer-menu')}
                className="text-teal-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Test open in browser</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Scannable Stand Card (Single QR Code) */}
        <div className="lg:col-span-6 flex flex-col items-center w-full">
          <div className="w-full max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-[#070d18] p-5 sm:p-8 text-center relative printable-stand">
            {/* Top Emblem */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                  accentTheme === 'saffron'
                    ? 'bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : accentTheme === 'emerald'
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                    : accentTheme === 'obsidian'
                    ? 'bg-slate-800 text-teal-300 border border-slate-700'
                    : 'bg-teal-400 text-slate-950 shadow-teal-500/20'
                }`}
              >
                <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight break-words">{restaurant.name}</h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{restaurant.cuisine}</p>

            <div className="my-2.5 sm:my-3 inline-block px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-teal-300 text-xs font-bold">
              DIGITAL MENU
            </div>

            {/* Real Scannable QR Code Canvas Box (High contrast dark-on-white) */}
            <div className="my-4 sm:my-5 p-3.5 bg-white rounded-2xl shadow-xl mx-auto w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center relative border border-slate-200">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Digital Menu QR code for ${restaurant.name}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Scan to view our menu
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Point phone camera · No app required
              </p>
            </div>

            {/* Wi-Fi Footnote Box */}
            <div className="mt-4 sm:mt-5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-teal-300">
                <Wifi className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">Free Wi-Fi: {restaurant.wifiSsid}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Password: <span className="text-slate-300 font-bold">{restaurant.wifiPass}</span>
              </div>
            </div>
          </div>

          {/* Download & Print Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mt-5 sm:mt-6 w-full max-w-xs sm:max-w-sm">
            <button
              type="button"
              onClick={() => handleDownloadPng('stand')}
              disabled={isDownloading || !qrDataUrl}
              className="flex-1 px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 active:scale-95 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              title="Download high-resolution display stand PNG"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Generating...' : 'Download Stand (PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPrintModal}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2 border border-slate-700"
              title="Print display stand on card or letter paper"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Print Display Stand</span>
            </button>
          </div>

          {/* Alternate QR-only Download */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => handleDownloadPng('qr-only')}
              className="text-[11px] text-slate-400 hover:text-teal-300 underline"
            >
              Download QR Code only (PNG)
            </button>
          </div>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1426] border border-slate-700 rounded-2xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              aria-label="Close print modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Printer className="w-4 h-4" />
              <span>Print Display Stand Layout</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Print-Ready Preview</h2>
            <p className="text-xs text-slate-400 mb-4">
              Formatted for crisp, high-contrast printing on standard letter, A4 paper, or acrylic stand inserts.
            </p>

            {/* Print Preview Card with White Paper Contrast */}
            <div className="bg-white text-slate-900 rounded-2xl p-6 border-2 border-slate-900 text-center shadow-lg mx-auto max-w-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base tracking-tight">{restaurant.name}</h3>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
                {restaurant.cuisine}
              </p>

              <div className="inline-block px-3 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-xs font-bold">
                OFFICIAL DIGITAL MENU
              </div>

              {qrDataUrl && (
                <div className="p-2 border-2 border-slate-900 rounded-xl max-w-[180px] mx-auto bg-white">
                  <img src={qrDataUrl} alt="Menu QR Code" className="w-full h-auto" />
                </div>
              )}

              <div className="space-y-0.5">
                <h4 className="font-bold text-xs uppercase tracking-wide">Scan to view our menu</h4>
                <p className="text-[10px] text-slate-500">Point phone camera · No download or login required</p>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-700 space-y-0.5">
                <div className="font-semibold text-slate-900">Wi-Fi: {restaurant.wifiSsid}</div>
                <div className="font-mono text-slate-600">Password: {restaurant.wifiPass}</div>
              </div>
            </div>

            {/* Print Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPrintModalOpen(false);
                  setTimeout(() => handleExecutePrint(), 200);
                }}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Display Stand Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
