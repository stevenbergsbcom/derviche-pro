'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Navigation Desktop */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/accueil" className="flex items-center">
            <Image
              src="/images/logos/logo-derviche-bleu.png"
              alt="Derviche Diffusion"
              width={180}
              height={70}
              className="h-12 md:h-16 w-auto"
              priority
            />
          </Link>

          {/* Navigation Desktop - À gauche, en bleu clair */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/catalogue"
              className="text-lg font-medium text-muted-foreground hover:text-derviche transition"
            >
              Catalogue
            </Link>
            <Link
              href="#contact"
              className="text-lg font-medium text-muted-foreground hover:text-derviche transition"
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Auth buttons Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="text-lg" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button className="text-lg bg-derviche hover:bg-derviche-dark" asChild>
            <Link href="/register">Inscription</Link>
          </Button>
        </div>

        {/* Menu Burger Mobile */}
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col items-center gap-4">
            <Link
              href="/catalogue"
              className="text-lg font-medium py-2 text-muted-foreground hover:text-derviche transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Catalogue
            </Link>
            <Link
              href="#contact"
              className="text-lg font-medium py-2 text-muted-foreground hover:text-derviche transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <hr className="my-2 w-full" />
            <Link
              href="/login"
              className="text-lg font-medium py-2 hover:text-derviche transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Connexion
            </Link>
            <Button className="w-full max-w-xs text-lg bg-derviche hover:bg-derviche-dark" asChild>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                Inscription
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
