import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-10 md:py-12 bg-derviche-dark text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Info */}
          <div className="sm:col-span-2 text-center md:text-left">
            <Image
              src="/images/logos/logo-derviche-blanc-transparent.png"
              alt="Derviche Diffusion"
              width={280}
              height={110}
              className="h-28 md:h-20 w-auto mb-4 mx-auto md:mx-0"
            />
            <p className="text-white/70 text-sm mb-4 max-w-sm mx-auto md:mx-0">
              Agence de production et de diffusion de spectacles vivants depuis 2016.
              Nous accompagnons les compagnies artistiques et les programmateurs.
            </p>
            <div className="flex gap-6 justify-center md:justify-start">
              <a
                href="https://www.facebook.com/Derviche-Diffusion-104081770023884"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-gold transition"
              >
                <Facebook className="w-9 h-9 md:w-6 md:h-6" />
              </a>
              <a
                href="https://www.instagram.com/dervichediffusion/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-gold transition"
              >
                <Instagram className="w-9 h-9 md:w-6 md:h-6" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4 text-gold">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/catalogue" className="text-white/70 hover:text-white transition">Catalogue</Link></li>
              <li><Link href="#contact" className="text-white/70 hover:text-white transition">Contact</Link></li>
              <li><Link href="/login" className="text-white/70 hover:text-white transition">Connexion</Link></li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4 text-gold">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-white/70 hover:text-white transition">Mentions légales</Link></li>
              <li><Link href="#" className="text-white/70 hover:text-white transition">Politique de confidentialité</Link></li>
              <li><Link href="#" className="text-white/70 hover:text-white transition">CGU</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50 text-center md:text-left">
          <p>© 2025 Derviche Diffusion. Tous droits réservés.</p>
          <p>
            13, rue de Cotte - 75012 Paris |
            <a href="mailto:derviche@dervichediffusion.com" className="hover:text-white transition ml-1">
              derviche@dervichediffusion.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
