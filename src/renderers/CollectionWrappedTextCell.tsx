"use client";
import React, { useLayoutEffect, useRef } from "react";

export function CollectionWrappedTextCell({ label, value, disabled, onChange, resize = "vertical" }: {
  label: string; value: string; disabled: boolean; onChange: (value: string) => void;
  resize?: "vertical" | "none";
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = input.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return <textarea ref={input} aria-label={label}
    className={`block min-h-10 w-full min-w-0 ${resize === "vertical" ? "resize-y" : "resize-none"} whitespace-pre-wrap break-words rounded border border-transparent bg-transparent px-1 py-1 text-sm leading-5 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:focus:border-blue-700 dark:focus:bg-slate-900 dark:focus:ring-blue-950`}
    rows={2} value={value} disabled={disabled} onChange={event => onChange(event.target.value)} />;
}
