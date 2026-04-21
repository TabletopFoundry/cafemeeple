"use client";

import { useEffect } from "react";

const BASE_TITLE = "CaféMeeple";

export function usePageTitle(pageTitle: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${pageTitle} — ${BASE_TITLE}`;
    return () => {
      document.title = previous;
    };
  }, [pageTitle]);
}
