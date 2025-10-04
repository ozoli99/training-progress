import * as React from "react";

export function useKPIs(logs: any[]) {
    return React.useMemo(() => {
        let sessions = 0;
        let volume = 0;
        for (const log of logs) {
            sessions++;
            for (const set of (log.sets ?? [])) {
                if (set.reps && set.weight) {
                    volume += set.reps * set.weight;
                }
            }
        }
        return { sessions, volume };
    }, [logs]);
}