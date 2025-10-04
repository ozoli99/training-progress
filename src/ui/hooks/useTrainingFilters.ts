"use client";

import * as React from "react";

type State = { start: string; end: string; metric: "volume" | "one_rep_max" };
type Action =
    | { type: "range"; start: string; end: string }
    | { type: "metric"; metric: State["metric"] };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "range": return { ...state, start: action.start, end: action.end };
        case "metric": return { ...state, metric: action.metric };
        default: return state;
    }
}

export function useTrainingFilters() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 28);
    const [state, dispatch] = React.useReducer(reducer, {
        start: start.toISOString().slice(0, 10),
        end: today.toISOString().slice(0, 10),
        metric: "volume",
    });
    React.useEffect(() => {
        localStorage.setItem("filters", JSON.stringify(state));
    }, [state]);
    return { state, dispatch };
}