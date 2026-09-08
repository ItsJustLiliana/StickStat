"use client";

import { useEffect, useState } from "react";

type MatchTab = "attendance" | "tasks" | "lineup" | "performance";

type Props = {
    attendance: React.ReactNode;
    tasks: React.ReactNode;
    lineup: React.ReactNode;
    performance: React.ReactNode;
};

const tabLabels: Record<MatchTab, string> = {
    attendance: "Aanwezig",
    tasks: "Taken",
    lineup: "Opstelling",
    performance: "Prestaties",
};

export function MatchDetailTabs({ attendance, tasks, lineup, performance }: Props) {
    const [active, setActive] = useState<MatchTab>("attendance");
    const [mounted, setMounted] = useState<MatchTab[]>(["attendance"]);
    const panels: Record<MatchTab, React.ReactNode> = { attendance, tasks, lineup, performance };

    useEffect(() => {
        const timer = window.setTimeout(() => setMounted(["attendance", "tasks", "lineup", "performance"]), 250);
        return () => window.clearTimeout(timer);
    }, []);

    function select(tab: MatchTab) {
        setActive(tab);
        setMounted(current => current.includes(tab) ? current : [...current, tab]);
    }

    return (
        <section className="match-tabs-wrap">
            <div className="match-tabs" role="tablist" aria-label="Wedstrijdonderdelen">
                {(Object.keys(tabLabels) as MatchTab[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={active === tab}
                        aria-controls={`match-tab-panel-${tab}`}
                        className={active === tab ? "active" : ""}
                        onClick={() => select(tab)}
                    >
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>
            {(Object.keys(tabLabels) as MatchTab[]).map(tab => mounted.includes(tab) && <div key={tab} id={`match-tab-panel-${tab}`} role="tabpanel" className="match-tab-panel" hidden={active !== tab}>{panels[tab]}</div>)}
        </section>
    );
}
