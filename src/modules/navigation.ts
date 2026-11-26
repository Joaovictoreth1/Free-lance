export interface NavigationController {
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

export function initNavigation(root: Document = document): NavigationController {
  const navbar = root.getElementById('navbar');
  const menuButton = root.getElementById('mobile-menu-btn');
  const mobileMenu = root.getElementById('mobile-menu');
  const iconOpen = root.getElementById('mobile-menu-icon-open');
  const iconClose = root.getElementById('mobile-menu-icon-close');

  let open = false;

  const syncMenuState = (nextOpen: boolean): void => {
    open = nextOpen;
    if (mobileMenu) {
      mobileMenu.classList.toggle('hidden', !open);
      mobileMenu.hidden = !open;
    }
    if (menuButton) {
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute(
        'aria-label',
        open ? 'Fechar menu de navegação' : 'Abrir menu de navegação',
      );
    }
    if (iconOpen && iconClose) {
      iconOpen.classList.toggle('hidden', open);
      iconClose.classList.toggle('hidden', !open);
    }
    root.body.classList.toggle('overflow-hidden', open);
  };

  const openMobileMenu = (): void => {
    syncMenuState(true);
  };

  const closeMobileMenu = (): void => {
    if (!open) {
      return;
    }
    syncMenuState(false);
  };

  const toggleMobileMenu = (): void => {
    syncMenuState(!open);
  };

  const onButtonClick = (): void => {
    toggleMobileMenu();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && open) {
      closeMobileMenu();
      menuButton?.focus();
    }
  };

  const onMenuLinkClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a')) {
      closeMobileMenu();
    }
  };

  const onScroll = (): void => {
    if (!navbar) {
      return;
    }
    const scrolled = window.scrollY > 40;
    navbar.classList.toggle('shadow-lg', scrolled);
    navbar.classList.toggle('shadow-black/40', scrolled);
  };

  menuButton?.addEventListener('click', onButtonClick);
  mobileMenu?.addEventListener('click', onMenuLinkClick);
  root.addEventListener('keydown', onKeyDown);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return {
    openMobileMenu,
    closeMobileMenu,
    toggleMobileMenu,
    isOpen: () => open,
    destroy: () => {
      menuButton?.removeEventListener('click', onButtonClick);
      mobileMenu?.removeEventListener('click', onMenuLinkClick);
      root.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
      root.body.classList.remove('overflow-hidden');
    },
  };
}
