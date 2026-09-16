import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { cn } from "@/lib/utils";
import type { AppTab } from "@/types";

interface AppHeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const TABS: ReadonlyArray<{ id: AppTab; label: string }> = [
  { id: "najomnik", label: "Záujemca" },
  { id: "vlastnik", label: "Vlastník" },
];

/**
 * Sticky application header: brand mark plus the two-principal tab bar.
 *
 * Implemented as a proper ARIA tablist with roving tabindex and arrow-key
 * navigation, which is a documented accessibility requirement (§8). The
 * original prototype used a bare button with no roles or keyboard support.
 */
export function AppHeader({ activeTab, onSelectTab }: AppHeaderProps) {
  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = TABS.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = TABS[nextIndex];
    onSelectTab(nextTab.id);
    document.getElementById(`tab-${nextTab.id}`)?.focus();
  }

  return (
    <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b border-border bg-surface px-8 shadow-xs">
      <div className="flex items-center gap-[9px]">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-base font-bold tracking-[-0.5px] text-white"
        >
          N
        </span>
        <span className="font-serif text-[1.15rem] leading-none text-ink">
          Nájom<span className="text-accent">App</span>
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Prepnúť zobrazenie"
        onKeyDown={handleKeyDown}
        className="flex items-center gap-[2px] rounded-md border border-border bg-surface-3 p-[3px]"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                "cursor-pointer rounded-[7px] border-none bg-transparent px-4 py-1.5 font-sans text-[0.8125rem] whitespace-nowrap transition-colors",
                isActive
                  ? "bg-surface font-semibold text-ink shadow-xs"
                  : "font-medium text-muted hover:text-ink-3",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}