"use client";

import { useState } from "react";

type MatchTab = "attendance" | "tasks" | "lineup" | "performance";

type Props = {
    attendance: React.ReactNode;
    tasks: React.ReactNode;
    lineup: React.ReactNode;
    performance: React.ReactNode;
};

const tabLabels: Record<MatchTab, string> = {
    attendance: "Aanwezigheid",
    tasks: "Taken",
    lineup: "Opstelling",
    performance: "Prestaties",
};

export function MatchDetailTabs({ attendance, tasks, lineup, performance }: Props) {
    const [active, setActive] = useState<MatchTab>("attendance");
    const panelId = `match-tab-panel-${active}`;

    return (
        <section className="match-tabs-wrap">
            <div className="match-tabs" role="tablist" aria-label="Wedstrijdonderdelen">
                {(Object.keys(tabLabels) as MatchTab[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={active === tab}
                        aria-controls={panelId}
                        className={active === tab ? "active" : ""}
                        onClick={() => setActive(tab)}
                    >
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>
            <div id={panelId} role="tabpanel" className="match-tab-panel">
                {active === "attendance" ? attendance : active === "tasks" ? tasks : active === "lineup" ? lineup : performance}
            </div>
        </section>
    );
}
