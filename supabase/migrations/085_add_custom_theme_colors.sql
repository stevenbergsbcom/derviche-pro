-- Migration 085: Ajouter le paramètre custom_theme_colors
-- Stocke les 3 couleurs hex du thème personnalisé (primary, accent, sidebar)

INSERT INTO app_settings (key, value, description)
VALUES (
  'custom_theme_colors',
  '{"primary":"#3b4f8a","accent":"#d4a84b","sidebar":"#f0ece4"}',
  'Couleurs personnalisées du thème custom (hex): primary, accent, sidebar'
)
ON CONFLICT (key) DO NOTHING;
