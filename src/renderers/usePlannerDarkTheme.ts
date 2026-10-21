import { useEffect } from "react";
/** Native select menus and portaled dialogs inherit the same dark color-scheme. */
export function usePlannerDarkTheme(dark: boolean) {
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.classList.contains("dark");
    html.classList.toggle("dark", dark);
    return () => { html.classList.toggle("dark", previous); };
  }, [dark]);
}
