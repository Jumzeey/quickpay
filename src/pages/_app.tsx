"use client";
import Button from '@/components/button';
import Modal from '@/components/modal';
import SharedState from "@/context/sharedState";
import { ThemeProvider } from "@/context/ThemeContext";
import useAuthentication from "@/stores/useAuthentication";
import "@/styles/globals.css";
import { getToken, handleLogOut } from "@/util/utils";
import type { AppProps } from "next/app";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useEffect, useState } from "react";
import { useIdleTimer } from 'react-idle-timer';
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  const { user } = useAuthentication() || {};
  const [tracker, setTracker] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const idleTimeoutInMinutes = 5; // Configure idle timeout
  const warningTimeBeforeLogoutInSeconds = 60; // Show warning 1 minute before logout

  // const logoutTimer: any = useRef(null);
  const [shouldLogout, setShouldLogout] = useState(false);

  // const handleIdle = () => {
  //   setShowIdleWarning(true);
  // };

  // const handleActive = () => {
  //   if (showIdleWarning) {
  //     setShowIdleWarning(false);
  //   }
  // };

  const handleLogoutTimer = () => {
    handleLogOut();
    setShowIdleWarning(false);
    setShouldLogout(false);
  };

  // Timer for warning
  const { activate: activateWarning } = useIdleTimer({
    timeout: 1000 * 60 * idleTimeoutInMinutes - 1000 * warningTimeBeforeLogoutInSeconds, // 4 minutes
    onIdle: () => {
      setShowIdleWarning(true);
      setShouldLogout(true);
      setRemainingTime(warningTimeBeforeLogoutInSeconds);
    },
    onActive: () => {
      // Only hide warning if user is active before the logout timer expires
      if (showIdleWarning && !shouldLogout) {
        setShowIdleWarning(false);
      }
    },
    debounce: 500,
    crossTab: true,
    events: [
      'mousemove',
      'keydown',
      'wheel',
      'DOMMouseScroll',
      'mousewheel',
      'mousedown',
      'touchstart',
      'touchmove',
      'MSPointerDown',
      'MSPointerMove',
      'visibilitychange',
      'focus'
    ]
  });

  // Timer for actual logout - separate from the warning timer
  const { activate: activateLogout } = useIdleTimer({
    timeout: 1000 * 60 * idleTimeoutInMinutes,
    onIdle: () => {
      // Only logout if the warning is showing (meaning user didn't interact after warning)
      handleLogoutTimer();
    },
    // onActive: () => {
    //   // If user becomes active while warning is shown, hide the warning
    //   if (showIdleWarning) {
    //     setShowIdleWarning(false);
    //   }
    // },
    crossTab: true,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showIdleWarning && shouldLogout) {
      interval = setInterval(() => {
        setRemainingTime((prevTime) => {
          const newTime = prevTime - 1;

          // If countdown reaches 0, logout immediately
          if (newTime <= 0) {
            handleLogoutTimer();
            return 0;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showIdleWarning, shouldLogout]);

  useEffect(() => {
    // Only run for authenticated users
    const isAuthenticated = getToken();
    if (!isAuthenticated) return;

    // Function to reset both timers
    const resetAllTimers = () => {
      activateWarning();
      activateLogout();
      setShowIdleWarning(false);
    };

    // Set up event listeners for user activity
    window.addEventListener("mousemove", resetAllTimers);
    window.addEventListener("keydown", resetAllTimers);
    window.addEventListener("wheel", resetAllTimers);
    window.addEventListener("mousedown", resetAllTimers);

    return () => {
      // Clean up event listeners
      window.removeEventListener("mousemove", resetAllTimers);
      window.removeEventListener("keydown", resetAllTimers);
      window.removeEventListener("wheel", resetAllTimers);
      window.removeEventListener("mousedown", resetAllTimers);
    };
  }, [activateWarning, activateLogout, shouldLogout]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const isAuthenticated = getToken();
    if (!isAuthenticated) {
      setShowIdleWarning(false);
      setShouldLogout(false);
    }
  }, []);

  // const startLogoutTimer = () => {
  //   const isAuthenticated = getToken();
  //   if (!isAuthenticated) return;

  //   if (logoutTimer.current) clearTimeout(logoutTimer.current);
  //   logoutTimer.current = setTimeout(() => {
  //     handleLogOut();
  //   }, 300000); // 5 minutes
  // };

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

  // useEffect(() => {
  //   startLogoutTimer();

  //   const handleUserActivity = () => {
  //     startLogoutTimer();
  //   };

  //   // Set up event listeners for user activity
  //   window.addEventListener("mousemove", handleUserActivity);
  //   window.addEventListener("keydown", handleUserActivity);
  //   window.addEventListener("scroll", handleUserActivity);
  //   window.addEventListener("click", handleUserActivity);

  //   return () => {
  //     if (logoutTimer.current) clearTimeout(logoutTimer.current);
  //     // Clean up event listeners
  //     window.removeEventListener("mousemove", handleUserActivity);
  //     window.removeEventListener("keydown", handleUserActivity);
  //     window.removeEventListener("scroll", handleUserActivity);
  //     window.removeEventListener("click", handleUserActivity);
  //   };
  // }, []);

  return (
    <ThemeProvider>
      <SharedState>
        <main className={isClient ? `${plusJakartaSans.variable} font-sans` : "font-sans"}>
          <Toaster position="top-center" richColors />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
          />
          <Component {...pageProps} />

          <Modal
            isOpen={showIdleWarning}
            onClose={() => { }}
            title="Session Timeout Warning"
          >
            <div className="p-4">
              <p className="mb-4">
                Your session will expire in {remainingTime > 60
                  ? `${Math.floor(remainingTime / 60)} minute(s) and ${remainingTime % 60} seconds`
                  : `${remainingTime} seconds`
                } due to inactivity.
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
                  onClick={() => {
                    activateWarning(); // Reset the warning timer
                    activateLogout();  // Reset the logout timer
                    setShowIdleWarning(false);
                  }}
                  primary
                />
              </div>
            </div>
          </Modal>
        </main>
      </SharedState>
    </ThemeProvider>
  );
}
