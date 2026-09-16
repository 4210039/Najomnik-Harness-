import { useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { OwnerPage } from "@/pages/OwnerPage";
import { TenantPage } from "@/pages/TenantPage";
import type { AppTab } from "@/types";

/**
 * Application shell.
 *
 * Two sibling panels, mirroring the original prototype's #viewNajomnik /
 * #viewVlastnik arrangement (spec §3.2). Both stay mounted so in-progress form
 * state survives a tab switch; only visibility changes.
 *
 * NOTE: the Vlastník (owner) panel is NOT yet protected. Authentication lands
 * in Sprint 4.1 — until then this shell must not be deployed publicly.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("najomnik");

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <AppHeader activeTab={activeTab} onSelectTab={setActiveTab} />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2 focus:shadow-lg"
      >
        Preskočiť na obsah
      </a>

      <main id="main-content" className="flex-1">
        <div
          role="tabpanel"
          id="panel-najomnik"
          aria-labelledby="tab-najomnik"
          hidden={activeTab !== "najomnik"}
        >
          <TenantPage />
        </div>

        <div
          role="tabpanel"
          id="panel-vlastnik"
          aria-labelledby="tab-vlastnik"
          hidden={activeTab !== "vlastnik"}
        >
          <OwnerPage />
        </div>
      </main>
    </div>
  );
}