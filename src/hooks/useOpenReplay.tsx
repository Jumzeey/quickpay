import Tracker from "@openreplay/tracker";
import useAuthentication from "@/stores/useAuthentication";
import { useEffect } from "react";

const useOpenReplay = () => {
  const { email, business_type, business_name } =
    useAuthentication().user || {};

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tracker = new Tracker({
        projectKey: process.env.NEXT_PUBLIC_OPEN_REPLAY_KEY as string,
      });

      tracker.start({
        userID: email,
        metadata: {
          business_name,
          business_type,
        },
      });
    }
  }, [business_name, business_type, email]);

  return null;
};

export default useOpenReplay;
