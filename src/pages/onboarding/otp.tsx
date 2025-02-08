import Sidebar from "@/components/onboarding/sidebar";
import Link from "next/link";
import useAuthentication from "@/stores/useAuthentication";
import { useRouter } from "next/router";
import PinInput from "react-pin-input";
import { notifySuccess, notifyError } from "@/util/utils";
import { MultiStepAnimation } from "@/animations";
import { motion } from "framer-motion";
import NoSSR from "@/components/noSSR";
import Button from "@/components/button";
import { useEffect, useState } from "react";
import Loader from "@/components/loader";
import CountdownTimer from "@/components/countdown-timer";
import WebPageTitle from "@/components/WebPageTitle";
import { Spinner } from "@/components/Spinner";
import useScreenWidth from "@/hooks/useScreenWidth";

const OtpPage = () => {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [resendOtpLoading, setResendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const { source } = router.query;
  const { verifyOtp, resendOtp, forgotPasswordOtp, verify_reference } =
    useAuthentication();
  const userEmail =
    typeof window !== "undefined" ? localStorage?.getItem("user-email") : "";

  const screenWidth = useScreenWidth();

  const resendOtpSubmit = async (e: any) => {
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

  const handleSubmit = async (values: any) => {
    setVerifyOtpLoading(true);
    const payload = {
      verify_reference,
      otp: otp,
    };
    try {
      if (source === "sign-in") {
        await verifyOtp(payload);
        router.push({
          pathname: "/dashboard",
        });
      } else {
        const response = await forgotPasswordOtp(payload);
        notifySuccess(response.message);
        setVerifyOtpLoading(false);
        router.push({
          pathname: "/onboarding/reset-password",
        });
      }
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setVerifyOtpLoading(false);
    }
  };

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

  const mobileStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "12px",
  };

  const desktopStyle = {
    display: "flex",
    gap: "12px",
  };

  return (
    <div className="w-full min-h-screen flex justify-center text-white bg-ramp">
      <WebPageTitle title="OTP | Ramp Merchant Portal" />
      <NoSSR>
        <div className="flex w-full min-h-screen justify-center">
          {/* <Sidebar /> */}
          <div className="w-full lg:w-1/2 md:w-1/2 p-4 lg:p-32 lg:py-10 bg-black/20 backdrop-blur-sm shadow-lg">
            <motion.div
              className="mt-52"
              variants={MultiStepAnimation}
              initial="hidden"
              animate="visible"
            >
              <div className="mb-7">
                <h1 className="font-semibold text-2xl">OTP Verification</h1>
                <p className="font-light text-sm mt-2 mb-2 leading-6">
                  We sent you a one time password to this email address:
                  <span className="font-medium">({userEmail})</span>
                </p>
              </div>

              <div className="flex flex-col justify-center items-center">
                <PinInput
                  length={8}
                  initialValue=""
                  type="numeric"
                  inputMode="number"
                  onComplete={value => {
                    setOtp(value);
                  }}
                  style={screenWidth < 700 ? mobileStyle : desktopStyle}
                  inputStyle={{
                    border: "1px solid #d6d7df",
                    borderRadius: "5px",
                    background: "#f4f5fb",
                    color: "#042468",
                  }}
                  inputFocusStyle={{ border: "2px solid #164988" }}
                  autoSelect={true}
                  regexCriteria={/^[0-9]*$/}
                />
                <Button
                  className="mt-7"
                  onClick={handleSubmit}
                  text={verifyOtpLoading ? <Loader /> : "Continue"}
                  ariaLabel="Sign In Button"
                  disabled={verifyOtpLoading}
                  primary
                />
              </div>
              <div>
                {isDisabled ? (
                  <CountdownTimer initialSeconds={60} />
                ) : (
                  <p className="text-center cursor-pointer mt-5 text-sm relative">
                    Didn&apos;t receive an OTP? &nbsp;
                    <span
                      className={`font-medium ${
                        isDisabled
                          ? "cursor-not-allowed opacity-50"
                          : "text-primary"
                      }`}
                      onClick={
                        isDisabled ? e => e.preventDefault() : resendOtpSubmit
                      }
                    >
                      {resendOtpLoading ? (
                        <div className="absolute left-[68%] top-0">
                          <span>
                            <Spinner />
                          </span>
                        </div>
                      ) : (
                        <span className="underline-animation">Resend</span>
                      )}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex w-full justify-end my-16">
                <h6 className="text-sm">
                  Already have an account?
                  <Link
                    href="/onboarding/sign-in"
                    className="ml-1 underline-animation text-white font-medium"
                  >
                    Sign In
                  </Link>
                </h6>
              </div>
            </motion.div>
          </div>
        </div>
      </NoSSR>
    </div>
  );
};

export default OtpPage;
