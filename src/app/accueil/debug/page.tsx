/**
 * Page de debug temporaire — PWA Install Banner
 * Derviche Diffusion
 *
 * ⚠️ À SUPPRIMER après diagnostic
 * Accessible sur /accueil/debug
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface DebugInfo {
  standalone: boolean;
  fullscreen: boolean;
  minimalUi: boolean;
  sessionKey: string | null;
  userAgent: string;
  platform: string;
}

export default function DebugPage() {
  const [info, setInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    const isIosNonSafari = isIos && /crios|fxios|opios|mercury/i.test(ua);

    let platform = 'unknown';
    if (isIos && isIosNonSafari) platform = 'ios-chrome';
    else if (isIos) platform = 'ios-safari';
    else if (isAndroid) platform = 'android';
    else platform = 'desktop';

    setInfo({
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      fullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
      minimalUi: window.matchMedia('(display-mode: minimal-ui)').matches,
      sessionKey: sessionStorage.getItem('pwa-banner-dismissed'),
      userAgent: ua,
      platform,
    });
  }, []);

  const handleClearSession = () => {
    sessionStorage.removeItem('pwa-banner-dismissed');
    window.location.reload();
  };

  if (!info) return <p className="p-6">Chargement...</p>;

  const isBlocked =
    info.standalone || info.fullscreen || info.minimalUi || info.sessionKey === '1';

  return (
    <div className="p-6 space-y-4 font-mono text-sm">
      <h1 className="text-lg font-bold">Debug — PWA Banner</h1>

      <div
        className={`rounded-lg p-3 font-semibold ${
          isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}
      >
        {isBlocked ? '❌ Bannière MASQUÉE' : '✅ Bannière VISIBLE'}
      </div>

      <table className="w-full border-collapse text-xs">
        <tbody>
          <Row label="display-mode: standalone" value={info.standalone} />
          <Row label="display-mode: fullscreen" value={info.fullscreen} />
          <Row label="display-mode: minimal-ui" value={info.minimalUi} />
          <Row label="sessionStorage dismissed" value={info.sessionKey === '1'} />
          <tr className="border-t">
            <td className="py-1 pr-4 font-semibold">Plateforme détectée</td>
            <td className="py-1 text-blue-700">{info.platform}</td>
          </tr>
        </tbody>
      </table>

      <div className="bg-gray-100 rounded p-3 break-all text-xs text-gray-600">
        <p className="font-semibold mb-1">User Agent :</p>
        {info.userAgent}
      </div>

      {info.sessionKey === '1' && (
        <Button onClick={handleClearSession} variant="destructive" size="sm">
          Effacer sessionStorage + recharger
        </Button>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: boolean }) {
  return (
    <tr className="border-t">
      <td className="py-1 pr-4 font-semibold">{label}</td>
      <td className={`py-1 font-bold ${value ? 'text-red-600' : 'text-green-600'}`}>
        {value ? 'true ❌' : 'false ✅'}
      </td>
    </tr>
  );
}
