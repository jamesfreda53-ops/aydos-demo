/**
 * Utility functions for reading and restoring scroll positions across desktop and mobile simulator frames.
 */

export function getScrollPosition(): number {
  const phoneContainer = document.querySelector<HTMLElement>("[data-phone-scroll-container]");
  if (phoneContainer && phoneContainer.scrollTop > 0) {
    return phoneContainer.scrollTop;
  }
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function restoreScrollPosition(top: number, behavior: ScrollBehavior = "auto") {
  // Execute immediately and then after a brief animation frame to guarantee layout has settled
  const applyScroll = () => {
    const phoneContainer = document.querySelector<HTMLElement>("[data-phone-scroll-container]");
    if (phoneContainer) {
      phoneContainer.scrollTo({ top, behavior });
    }
    window.scrollTo({ top, behavior });
  };

  applyScroll();
  requestAnimationFrame(() => {
    applyScroll();
  });
  // Extra safeguard for dynamically rendered images/cards
  setTimeout(() => {
    applyScroll();
  }, 40);
}
