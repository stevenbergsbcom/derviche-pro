/**
 * ScrollTopButton — Bouton flottant de retour en haut de page
 * Apparait lorsque l'utilisateur a scrollé au-delà de 400px.
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollTopButton() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!showScrollTop) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 bg-derviche hover:bg-derviche-dark text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
      aria-label="Retour en haut"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
