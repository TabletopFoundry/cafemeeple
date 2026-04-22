"use client";

import { useEffect } from "react";

const BASE_TITLE = "CaféMeeple";

/**
 * Sets `document.title` to `"<pageTitle> — CaféMeeple"` while the
 * component is mounted, and restores the previous title on unmount.
 *
 * @param pageTitle - The page-specific portion of the title.
 *
 * @example
 * usePageTitle("Game Library"); // → "Game Library — CaféMeeple"
 */
export function usePageTitle(pageTitle: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${pageTitle} — ${BASE_TITLE}`;
    return () => {
      document.title = previous;
    };
  }, [pageTitle]);
}
