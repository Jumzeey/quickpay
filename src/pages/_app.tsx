"use client";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import SharedState from "@/context/sharedState";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useState, useEffect, useRef, MutableRefObject } from "react";
import { handleLogOut } from "@/util/utils";
import { getToken } from "@/util/utils";
import useAuthentication from "@/stores/useAuthentication";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  const { user } = useAuthentication() || {};
  const [tracker, setTracker] = useState<any>(null);

  const logoutTimer: any = useRef(null);

  const startLogoutTimer = () => {
    const isAuthenticated = getToken();
    if (!isAuthenticated) return;

    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => {
      handleLogOut();
    }, 300000); // 5 minutes
  };

  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_APPLICATION_ENV === "production") {
      const initOpenReplay = async () => {
        const Tracker = (await import("@openreplay/tracker")).default;
        const trackerInstance = new Tracker({
          projectKey: process.env.NEXT_PUBLIC_OPEN_REPLAY_KEY
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
      tracker.setMetadata('business_name', user.business_name);
      tracker.setMetadata('business_type', user.business_type);
    }
  }, [tracker, user]);

  useEffect(() => {
    startLogoutTimer();

    const handleUserActivity = () => {
      startLogoutTimer();
    };

    // Set up event listeners for user activity
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);
    window.addEventListener("click", handleUserActivity);

    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      // Clean up event listeners
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
    };
  }, []);

  return (
    <SharedState>
      <main className={`${plusJakartaSans.variable} font-sans`}>
        <Toaster position="top-center" richColors />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <Component {...pageProps} />
      </main>
    </SharedState>
  );
}
