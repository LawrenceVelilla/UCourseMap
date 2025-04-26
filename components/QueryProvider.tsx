"use client"; // This component needs to be a client component

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Optional: If you want React Query DevTools
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
// We create the client inside the component to ensure it's only created once per render
// on the client-side. Avoid creating it globally in a client component module.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Configure default options for all queries if needed
        staleTime: 60 * 1000, // 1 minute
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState lazy initial state --->( `useState(() => new QueryClient())` )
  // to prevent re-renders on every render, especially during Suspense.
  // Instead, use the approach above or simply `const [queryClient] = useState(new QueryClient())`
  // if you don't need server-side rendering support with query prefetching.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Optional: React Query DevTools - useful during development */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
