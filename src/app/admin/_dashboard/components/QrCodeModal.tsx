/**
 * QrCodeModal - QR Code d'accès rapide à la PWA check-in
 * Derviche Diffusion
 *
 * Affiche un QR code encodant l'URL de la PWA /accueil.
 * Permet le téléchargement en PNG pour impression sur le terrain.
 */

'use client';

import { useRef, useCallback, memo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QrCode, Download, ExternalLink, ArrowRight } from 'lucide-react';

// ============================================
// CONSTANTES
// ============================================

/** URL encodée dans le QR code */
const PWA_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://derviche-pro.fr'}/accueil`;

/** Taille du QR code en pixels */
const QR_SIZE = 256;

// ============================================
// COMPOSANT
// ============================================

function QrCodeModalComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Télécharge le QR code en PNG
   * Utilise le canvas HTML5 natif via la ref QRCodeCanvas
   */
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'derviche-pro-checkin-qrcode.png';
    link.click();
  }, []);

  return (
    <Dialog>
      {/* Déclencheur : carte dans la grille d'accès rapides */}
      <DialogTrigger asChild>
        <Card
          className="hover:bg-muted/50 transition-colors cursor-pointer h-full"
          role="button"
          aria-label="Ouvrir le QR code d'accès à la PWA Accueil"
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <QrCode aria-hidden="true" className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">QR Code Application</p>
              <p className="text-sm text-muted-foreground truncate">
                Accès rapide à la PWA
              </p>
            </div>
            <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </DialogTrigger>

      {/* Contenu de la modale */}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code — Application Accueil</DialogTitle>
          <DialogDescription>
            Scannez ce QR code pour accéder directement à l&apos;application d'Accueil. Téléchargez-le
            en PNG pour l&apos;imprimer.
          </DialogDescription>
        </DialogHeader>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="p-4 bg-white rounded-xl border shadow-sm">
            <QRCodeCanvas
              ref={canvasRef}
              value={PWA_URL}
              size={QR_SIZE}
              level="M"
              marginSize={2}
              title="QR Code accès PWA Accueil Derviche Pro"
            />
          </div>

          {/* URL affichée */}
          <p className="text-xs text-muted-foreground text-center font-mono break-all">
            {PWA_URL}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleDownload}
            className="flex-1"
            aria-label="Télécharger le QR code en PNG"
          >
            <Download aria-hidden="true" className="h-4 w-4 mr-2" />
            Télécharger PNG
          </Button>
          <Button
            variant="outline"
            asChild
            className="flex-1"
          >
            <a
              href={PWA_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ouvrir la PWA Accueil dans un nouvel onglet"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4 mr-2" />
              Ouvrir la PWA
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

QrCodeModalComponent.displayName = 'QrCodeModal';

export const QrCodeModal = memo(QrCodeModalComponent);
