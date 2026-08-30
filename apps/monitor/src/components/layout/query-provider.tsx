"use client";

// =============================================================================
// Resume Buddy Monitor v2 — TanStack Query & Theme Provider
// =============================================================================

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0b0f19",
            border: "1px solid #1e293b",
            color: "#f8fafc",
          },
        }}
      />
    </QueryClientProvider>
  );
}
