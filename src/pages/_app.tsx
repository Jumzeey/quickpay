"use client";
import "../../sentry.client.config";
import Button from '@/components/button';
import Modal from '@/components/modal';
import SharedState from "@/context/sharedState";
import { ThemeProvider } from "@/context/ThemeContext";
import useAuthentication from "@/stores/useAuthentication";
import "@/styles/globals.css";
import { getToken, handleLogOut } from "@/util/utils";
import type { AppProps } from "next/app";
import { Manrope } from "next/font/google";
import { useEffect, useState } from "react";
import { useIdleTimer } from 'react-idle-timer';
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const timeout = 10 * 60 * 1000 // 10 minutes
const promptBeforeIdle = 1 * 60 * 1000 // (1 minute)

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const { user, fetch2faStatus } = useAuthentication() || {};
  const [tracker, setTracker] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [shouldLogout, setShouldLogout] = useState(true);
  const [state, setState] = useState<string>('Active')
  const [remaining, setRemaining] = useState<number>(timeout)
  const [open, setOpen] = useState<boolean>(false)

  const onIdle = () => {
    setState('Idle')
    setOpen(false)
    handleLogoutTimer()
  }

  const onActive = () => {
    setState('Active')
    setOpen(false)
  }

  // this will open modal
  const onPrompt = () => {
    setState('Prompted')
    setOpen(true)
  }

  const { getRemainingTime, activate } = useIdleTimer({
    onIdle,
    onActive,
    onPrompt,
    timeout,
    promptBeforeIdle,
    throttle: 1000,
    crossTab: true,
    syncTimers: 1000,
    events: ['mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove'],
  })

  useEffect(() => {
    const isAuthenticated = getToken();
    if (!isAuthenticated) {
      return;
    }

    const interval = setInterval(() => {
      setRemaining(Math.ceil(getRemainingTime() / 1000))
    }, 500)

    return () => {
      clearInterval(interval)
    }
  })

  const handleStillHere = () => activate();

  const seconds = remaining > 1 ? 'seconds' : 'second'

  const handleLogoutTimer = () => {
    const isAuthenticated = getToken();
    if (isAuthenticated) {
      handleLogOut();
    }
    setShouldLogout(false);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch 2FA status when user is logged in so totp_enabled is available for sensitive actions
  useEffect(() => {
    if (user && typeof fetch2faStatus === "function") {
      fetch2faStatus();
    }
  }, [user, fetch2faStatus]);

  useEffect(() => {
    const isAuthenticated = getToken();
    setShouldLogout(!isAuthenticated ? false : true);
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_APPLICATION_ENV === "production"
    ) {
      const initOpenReplay = async () => {
        const Tracker = (await import("@openreplay/tracker")).default;
        const trackerInstance = new Tracker({
          projectKey: process.env.NEXT_PUBLIC_OPEN_REPLAY_KEY,
        });
        trackerInstance.start();
        setTracker(trackerInstance);
      };
      initOpenReplay();
    }
  }, []);

  useEffect(() => {
    if (tracker && user) {
      tracker.setUserID(user.email);
      tracker.setMetadata("business_name", user.business_name);
      tracker.setMetadata("business_type", user.business_type);
    }
  }, [tracker, user]);

  // Load Headway widget only after the container is in the DOM (isClient = true)
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;
    (window as any).HW_config = { selector: ".headway-widget", account: "7kE2Wy" };
    if (document.querySelector('script[src="https://cdn.headwayapp.co/widget.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://cdn.headwayapp.co/widget.js";
    script.async = true;
    document.body.appendChild(script);
  }, [isClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SharedState>
          <main className={isClient ? `${manrope.variable} font-sans` : "font-sans"}>
            <Toaster />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1"
            />
            <Component {...pageProps} />

            <Modal
              isOpen={state === 'Prompted' && open && shouldLogout}
              onClose={() => { }}
              title="Session Timeout Warning"
            >
              <div className="p-4">
                <p className="mb-4">
                  Your session will expire in {remaining} {seconds} due to inactivity.
                  Would you like to continue your session?
                </p>

                <div className="flex justify-end gap-3">
                  <Button
                    text="Log Out Now"
                    ariaLabel="Log out now"
                    onClick={handleLogoutTimer}
                    className="bg-gray-200 text-gray-800"
                  />
                  <Button
                    text="Continue Session"
                    ariaLabel="Continue session"
                    onClick={handleStillHere}
                    primary
                  />
                </div>
              </div>
            </Modal>

            {/* Headway changelog widget - only render on client to avoid hydration mismatch when Headway injects content */}
            {isClient && (
              <div
                className="headway-widget fixed bottom-6 right-6 z-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-hidden
              />
            )}
          </main>
        </SharedState>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
