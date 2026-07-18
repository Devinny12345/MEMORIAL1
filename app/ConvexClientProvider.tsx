"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Only create the client if we have a valid URL
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    // Convex not configured — render children without provider so site still works
    return <>{children}</>;
  }
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
