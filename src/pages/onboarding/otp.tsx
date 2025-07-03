import { AuthFooter } from "@/components/AuthFooter";
import Button from "@/components/button";
import NoSSR from "@/components/noSSR";
import WebPageTitle from "@/components/WebPageTitle";
import useAuthentication from "@/stores/useAuthentication";
import { notifyError, notifySuccess } from "@/util/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import PinInput from "react-pin-input";

const OtpPage = () => {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [resendOtpLoading, setResendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const { source } = router.query;
  const { verifyOtp, resendOtp, forgotPasswordOtp, verify_reference } = useAuthentication();

  const userEmail = typeof window !== "undefined" ? localStorage?.getItem("user-email") : "";

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDisabled(false);
    }
  }, [countdown]);

  const handleSubmit = async () => {
    setVerifyOtpLoading(true);
    try {
      const payload = { verify_reference, otp };

      if (source === "sign-in") {
        await verifyOtp(payload);
        router.push("/dashboard");
      } else {
        const response = await forgotPasswordOtp(payload);
        notifySuccess(response.message);
        router.push("/onboarding/reset-password");
      }
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isDisabled) return;

    setResendOtpLoading(true);
    try {
      const response = await resendOtp(verify_reference);
      notifySuccess(response.message);
      setCountdown(30);
      setIsDisabled(true);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setResendOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-auth bg-opacity-10">
      <WebPageTitle title="OTP Verification | Ramp Merchant Portal" />
      <NoSSR>
        <div className="w-full max-w-xl mx-auto">
          {/* Card Container */}
          <div className="bg-white border border-[#C4C4C466] rounded-lg overflow-hidden">
            {/* Logo Section */}
            <div className="px-8 pt-8 pb-4 bg-auth-header">
              <div className="flex items-center">
                <Image
                  src="/images/ramp-logo.svg"
                  alt="Ramp"
                  width={80}
                  height={40}
                  priority
                  className="h-10 w-auto"
                />
              </div>
            </div>

            {/* OTP Form */}
            <div className="px-8 pb-8 mt-12">
              <h2 className="text-lg font-extrabold text-[#184078] mb-2">
                Verify OTP
              </h2>
              <p className="text-sm text-[#00000080] font-medium mb-8">
                We sent an OTP to{' '}
                <span className="font-medium text-primary">({userEmail})</span>
              </p>

              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <PinInput
                    length={8}
                    initialValue=""
                    type="numeric"
                    inputMode="number"
                    onComplete={value => setOtp(value)}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}
                    inputStyle={{
                      width: '49.33px',
                      height: '50px',
                      border: '1.5px solid #C4C4C43D',
                      borderRadius: '5px',
                      fontSize: '16px',
                      color: '#111827',
                    }}
                    inputFocusStyle={{
                      border: '2px solid #2563EB',
                      outline: 'none'
                    }}
                    autoSelect={true}
                    regexCriteria={/^[0-9]*$/}
                  />
                </div>

                <div className="pt-5 flex items-center justify-between">
                  <div className="w-1/2">
                    <Button
                      onClick={handleSubmit}
                      className="w-full py-2.5 text-sm font-medium rounded"
                      text={verifyOtpLoading ? "Verifying..." : "Verify OTP"}
                      ariaLabel="Verify OTP Button"
                      disabled={verifyOtpLoading}
                      primary
                    />
                  </div>

                  <p className="text-sm text-[#090727] font-medium underline cursor-pointer">
                    Back to{' '}
                    <Link
                      href="/onboarding/sign-in"
                      className="hover:text-blue-700"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Sign In */}
            <div className="mt-6 mx-2 mb-2 bg-[#EFF7FE] rounded-b-lg py-6 flex items-center justify-center">
              <button
                onClick={handleResendOtp}
                disabled={isDisabled || resendOtpLoading}
                className={`text-sm font-medium ${isDisabled
                  ? 'text-[#7F7F7F] cursor-not-allowed'
                  : 'text-primary hover:text-blue-700'
                  }`}
              >
                {isDisabled
                  ? `Resend code  in ${countdown}s`
                  : resendOtpLoading
                    ? 'Sending...'
                    : 'Resend OTP'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <AuthFooter />
        </div>
      </NoSSR>
    </div>
  );
};

export default OtpPage;
