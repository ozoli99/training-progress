"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [client] = React.useState(() => new QueryClient());
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}