"use client";

import { useEffect, useReducer } from "react";


type State = { start: string; end: string; numberOfWeeks: number; metric: "volume" | "one_rep_max" };
type Action =
    | { type: "range"; start: string; end: string }
    | { type: "metric"; metric: State["metric"] };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "range": return { ...state, start: action.start, end: action.end, numberOfWeeks: Math.round((new Date(action.end).getTime() - new Date(action.start).getTime()) / (1000 * 60 * 60 * 24 * 7)) };
        case "metric": return { ...state, metric: action.metric };
        default: return state;
    }
}

export function useTrainingFilters() {
    const defaultRange = 4; // weeks
    const today = new Date();
    const start = new Date(today.getTime() - defaultRange * 7 * 24 * 60 * 60 * 1000);
    const [state, dispatch] = useReducer(reducer, {
        start: start.toISOString().slice(0, 10),
        end: today.toISOString().slice(0, 10),
        numberOfWeeks: 4,
        metric: "volume",
    });
    useEffect(() => {
        localStorage.setItem("filters", JSON.stringify(state));
    }, [state]);
    return { state, dispatch };
}