"use client";

import React from "react";

interface Props {
  title: string;
  description: string;
  children: React.ReactNode;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

export function CollectionSettingsSection({ title, description, children, open, onToggle }: Props) {
  return <details open={open} onToggle={event => onToggle?.(event.currentTarget.open)}
    className="rounded-lg border border-[var(--planner-border)] p-2 dark:border-[var(--planner-border)]">
    <summary className="cursor-pointer rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <span className="block text-xs font-semibold">{title}</span>
      <span className="mt-1 block text-[11px] leading-relaxed text-[var(--planner-secondary)] dark:text-[var(--planner-secondary)]">{description}</span>
    </summary>
    <div className="mt-2 space-y-2">{children}</div>
  </details>;
}
