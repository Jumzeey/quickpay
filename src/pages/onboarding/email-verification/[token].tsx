import useAuthentication from "@/stores/useAuthentication";
import { notifyError, notifySuccess } from "@/util/utils";
import { useParams, useRouter } from "next/navigation";
import React, { useLayoutEffect } from "react";

const EmailVerificationPage = () => {
  const { verifyEmail } = useAuthentication();
  const params = useParams();
  const token = params?.token;
  const router = useRouter();
  const handleSubmit = async () => {
    try {
      const response = await verifyEmail(token);
      notifySuccess(response.message);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      router.push("/onboarding/sign-in");
    }
  };

  useLayoutEffect(() => {
    if (token) {
      handleSubmit();
    }
  }, [token]);

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <svg
        className={`animate-spin mr-1 w-20 mt-px text-[#164988]`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p className="text-primary font-medium pt-2">Please wait...</p>
    </div>
  );
};

export default EmailVerificationPage;
