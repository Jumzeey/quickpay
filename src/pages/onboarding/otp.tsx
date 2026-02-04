import { AuthFooter } from "@/components/AuthFooter";
import Button from "@/components/button";
import NoSSR from "@/components/noSSR";
import WebPageTitle from "@/components/WebPageTitle";
import useAuthentication from "@/stores/useAuthentication";
import { notifyError, notifySuccess } from "@/util/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import PinInput from "react-pin-input";

const EMAIL_OTP_LENGTH = 8;
const TOTP_LENGTH = 6;
const RECOVERY_CODE_LENGTH = 10;

const OtpPage = () => {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [resendOtpLoading, setResendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const { source } = router.query;
  const { verifyOtp, resendOtp, forgotPasswordOtp, verify_reference, allowed_methods = [] } = useAuthentication();

  const isTotp = allowed_methods.includes("totp");
  const pinLength = isTotp ? TOTP_LENGTH : EMAIL_OTP_LENGTH;

  const userEmail = typeof window !== "undefined" ? localStorage?.getItem("user-email") : "";

  const timerRef = useRef<NodeJS.Timeout>();

  const startCountdown = useCallback((count?: number) => {
    setCountdown(count || 60);
    setIsDisabled(true);

    const decrementCount = () => {
      setCountdown(prev => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          setIsDisabled(false);
          return 0;
        }
        return newCount;
      });
    };

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(decrementCount, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startCountdown]);

  const handleSubmit = async (code?: string) => {
    const codeValue = code ?? (useRecoveryCode ? recoveryCode : otp);
    const isRecovery = isTotp && useRecoveryCode;

    if (isRecovery) {
      const trimmed = codeValue.trim().toUpperCase();
      if (trimmed.length !== RECOVERY_CODE_LENGTH || !/^[A-Z0-9]+$/.test(trimmed)) {
        notifyError("Please enter a valid 10-character recovery code.");
        return;
      }
    } else if (!codeValue || codeValue.length !== pinLength) {
      notifyError(`Please enter a valid ${pinLength}-digit ${isTotp ? "code" : "OTP"}`);
      return;
    }

    setVerifyOtpLoading(true);
    try {
      const payload = { verify_reference, otp: isRecovery ? codeValue.trim().toUpperCase() : codeValue };

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

  const handleSubmitRecoveryCode = () => handleSubmit();

  const handleResendOtp = async () => {
    if (isDisabled) return;

    setResendOtpLoading(true);
    try {
      const response = await resendOtp(verify_reference);
      notifySuccess(response.message);
      startCountdown(30);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setResendOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-auth bg-opacity-10">
      <WebPageTitle title="OTP Verification | Cray Merchant Portal" />
      <NoSSR>
        <div className="w-full max-w-xl mx-auto">
          {/* Card Container */}
          <div className="bg-white border border-[#C4C4C466] rounded-lg overflow-hidden">
            {/* Logo Section */}
            <div className="px-8 pt-8 pb-4 bg-auth-header">
              <div className="flex items-center">
                <Image
                  src="/images/cray-logo.svg"
                  alt="Cray"
                  width={80}
                  height={32}
                  priority
                  className="h-8 w-auto"
                />
              </div>
            </div>

            {/* OTP Form - method determined by allowed_methods (email_otp = 8 digits, totp = 6 digits or backup code) */}
            <div className="px-8 pb-8 mt-12">
              <h2 className="text-lg font-extrabold text-[#184078] mb-2">
                {isTotp
                  ? useRecoveryCode
                    ? "Enter recovery code"
                    : "Authenticator code"
                  : "Verify OTP"}
              </h2>
              <p className="text-sm text-[#00000080] font-medium mb-4">
                {isTotp
                  ? useRecoveryCode
                    ? "Enter one of the 10-character recovery codes you saved when you set up 2FA."
                    : "Enter the 6-digit code from your authenticator app."
                  : <>We sent an OTP to{' '}<span className="font-medium text-primary">({userEmail})</span></>}
              </p>

              {isTotp && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecoveryCode((prev) => !prev);
                      setOtp("");
                      setRecoveryCode("");
                    }}
                    className="text-sm font-medium text-primary hover:text-blue-700"
                  >
                    {useRecoveryCode ? "Use authenticator code" : "Use a backup code"}
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {isTotp && useRecoveryCode ? (
                  <>
                    <div className="flex flex-col">
                      <label htmlFor="recovery-code" className="sr-only">
                        Recovery code
                      </label>
                      <input
                        id="recovery-code"
                        type="text"
                        inputMode="text"
                        autoComplete="one-time-code"
                        maxLength={RECOVERY_CODE_LENGTH}
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitRecoveryCode()}
                        placeholder="e.g. WO1EBITAQJ"
                        className="w-full max-w-[280px] mx-auto h-12 px-4 border border-[#C4C4C43D] rounded-lg text-center font-mono text-lg tracking-widest text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                    <div className="pt-5 flex items-center justify-between">
                      <div className="w-1/2">
                        <Button
                          onClick={handleSubmitRecoveryCode}
                          className="w-full py-2.5 text-sm font-medium rounded"
                          text={verifyOtpLoading ? "Verifying..." : "Verify"}
                          ariaLabel="Verify recovery code"
                          disabled={verifyOtpLoading || recoveryCode.length !== RECOVERY_CODE_LENGTH}
                          primary
                        />
                      </div>
                      <p className="text-sm text-[#090727] font-medium underline cursor-pointer">
                        Back to{' '}
                        <Link href="/onboarding/sign-in" className="hover:text-blue-700">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center">
                      <PinInput
                        key={isTotp ? "totp" : "email_otp"}
                        length={pinLength}
                        initialValue=""
                        type="numeric"
                        inputMode="number"
                        focus
                        onChange={(value) => {
                          setOtp(value);
                          if (value.length === pinLength) {
                            setTimeout(() => handleSubmit(value), 100);
                          }
                        }}
                        onComplete={(value) => {
                          setOtp(value);
                          setTimeout(() => handleSubmit(value), 100);
                        }}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          justifyContent: 'center'
                        }}
                        inputStyle={{
                          width: pinLength === 6 ? '44px' : '49.33px',
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
                          onClick={() => handleSubmit()}
                          className="w-full py-2.5 text-sm font-medium rounded"
                          text={verifyOtpLoading ? "Verifying..." : isTotp ? "Verify" : "Verify OTP"}
                          ariaLabel={isTotp ? "Verify code" : "Verify OTP Button"}
                          disabled={verifyOtpLoading}
                          primary
                        />
                      </div>
                      <p className="text-sm text-[#090727] font-medium underline cursor-pointer">
                        Back to{' '}
                        <Link href="/onboarding/sign-in" className="hover:text-blue-700">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Resend OTP - only for email OTP; always show for forgot-password */}
            {(source !== "sign-in" || !isTotp) && (
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
                    ? `Resend code in ${countdown}s`
                    : resendOtpLoading
                      ? 'Sending...'
                      : 'Resend OTP'}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <AuthFooter />
        </div>
      </NoSSR>
    </div>
  );
};

export default OtpPage;
