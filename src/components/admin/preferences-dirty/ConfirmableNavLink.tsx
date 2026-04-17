/**
 * ConfirmableNavLink
 * Derviche Diffusion
 *
 * Wrapper `<a>` qui intercepte le clic et délègue à `requestNavigation` du
 * Context. Utilisé par le sous-menu sidebar Préférences et, le cas échéant,
 * par tout item sidebar pour lequel on veut protéger les modifs en cours.
 *
 * S'utilise typiquement avec `asChild` sur un `SidebarMenuButton` ou
 * `SidebarMenuSubButton` :
 *
 *   <SidebarMenuButton asChild>
 *     <ConfirmableNavLink href="/admin/xxx">…</ConfirmableNavLink>
 *   </SidebarMenuButton>
 */

'use client';

import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { usePreferencesDirty } from './context';

export interface ConfirmableNavLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const ConfirmableNavLink = forwardRef<
  HTMLAnchorElement,
  ConfirmableNavLinkProps
>(function ConfirmableNavLink({ href, onClick, children, ...rest }, ref) {
  const { requestNavigation } = usePreferencesDirty();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // Laisse le browser gérer : cmd/ctrl-click, middle click, shift-click
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    requestNavigation(href);
  };

  return (
    <a ref={ref} href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
});
