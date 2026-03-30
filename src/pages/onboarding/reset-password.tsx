import { MultiStepAnimation } from "@/animations";
import { AuthFooter } from "@/components/AuthFooter";
import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import NoSSR from "@/components/noSSR";
import WebPageTitle from "@/components/WebPageTitle";
import { useFormValidation } from "@/hooks/useFormValidation";
import useAuthentication from "@/stores/useAuthentication";
import { notifyError, notifySuccess } from "@/util/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

interface FormValues {
  password: string;
  confirm_password: string;
}

const resetPasswordValidation = Yup.string()
  .required("Password is required!")
  .matches(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one symbol.")
  .matches(/\d/, "Password must contain at least one number.")
  .min(8, "Password must be at least 8 characters long")
  .matches(/[a-z]/, "Password must contain at least one lowercase letter")
  .matches(/[A-Z]/, "Password must contain at least one uppercase letter");

const validationSchema = Yup.object().shape({
  password: resetPasswordValidation,
  confirm_password: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

const ResetPassword: React.FC = () => {
  const router = useRouter();
  const { forgotPasswordOtp, verify_reference } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useFormValidation<FormValues>(validationSchema, {
    defaultValues: {
      password: "",
      confirm_password: "",
    },
    mode: "onChange",
  });

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const passwordValue = watch("password") || "";
  const passwordRequirements = useMemo(
    () => ({
      hasLowercase: /[a-z]/.test(passwordValue),
      hasUppercase: /[A-Z]/.test(passwordValue),
      hasSpecialCharacter: /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue),
      hasNumber: /\d/.test(passwordValue),
      hasMinLength: passwordValue.length >= 8
    }),
    [passwordValue]
  );
  const showPasswordChecklist = isPasswordFocused || passwordValue.length > 0;

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const otp = localStorage.getItem("forgot-password-otp");
      if (!verify_reference || !otp) {
        notifyError("Reset session expired. Please start again.");
        router.push("/onboarding/forgot-password");
        return;
      }
      const payload = {
        verify_reference,
        otp,
        password: values.password,
        confirm_password: values.confirm_password,
      };
      const response = await forgotPasswordOtp(payload);
      notifySuccess(response.message);
      localStorage.removeItem("user-email");
      localStorage.removeItem("forgot-password-otp");
      router.push("/onboarding/sign-in");
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-auth bg-opacity-10">
      <WebPageTitle title="Reset Password | Cray Merchant Portal" />
      <NoSSR>
        <motion.div
          className="flex flex-col items-center justify-center"
          variants={MultiStepAnimation}
          initial="hidden"
          animate="visible"
        >
          <div className="w-full max-w-md">
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

              {/* Reset Password Form */}
              <div className="px-8 pb-8 mt-12">
                <h2 className="text-lg font-extrabold text-[#184078] mb-8">
                  Create new password
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => {
                      const { onBlur, ...fieldProps } = field;
                      return (
                        <div className="space-y-3">
                          <FormInput
                            label="New Password"
                            id="password"
                            type="password"
                            htmlFor="password"
                            error={errors.password?.message}
                            touched={!!errors.password}
                            autoComplete="off"
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => {
                              onBlur();
                              setIsPasswordFocused(false);
                            }}
                            {...fieldProps}
                          />

                          {showPasswordChecklist && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${passwordRequirements.hasLowercase ? "bg-[#22A447]" : "bg-[#B3B3B3]"
                                    }`}
                                />
                                <p
                                  className={`text-xs ${passwordRequirements.hasLowercase ? "text-[#22A447]" : "text-[#7F7F7F]"
                                    }`}
                                >
                                  One lowercase letter
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${passwordRequirements.hasUppercase ? "bg-[#22A447]" : "bg-[#B3B3B3]"
                                    }`}
                                />
                                <p
                                  className={`text-xs ${passwordRequirements.hasUppercase ? "text-[#22A447]" : "text-[#7F7F7F]"
                                    }`}
                                >
                                  One uppercase letter
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${passwordRequirements.hasSpecialCharacter ? "bg-[#22A447]" : "bg-[#B3B3B3]"
                                    }`}
                                />
                                <p
                                  className={`text-xs ${passwordRequirements.hasSpecialCharacter ? "text-[#22A447]" : "text-[#7F7F7F]"
                                    }`}
                                >
                                  One special character
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${passwordRequirements.hasNumber ? "bg-[#22A447]" : "bg-[#B3B3B3]"
                                    }`}
                                />
                                <p
                                  className={`text-xs ${passwordRequirements.hasNumber ? "text-[#22A447]" : "text-[#7F7F7F]"
                                    }`}
                                >
                                  One number
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${passwordRequirements.hasMinLength ? "bg-[#22A447]" : "bg-[#B3B3B3]"
                                    }`}
                                />
                                <p
                                  className={`text-xs ${passwordRequirements.hasMinLength ? "text-[#22A447]" : "text-[#7F7F7F]"
                                    }`}
                                >
                                  8 characters minimum
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  <Controller
                    name="confirm_password"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        label="Confirm Password"
                        id="confirm_password"
                        type="password"
                        htmlFor="confirm_password"
                        error={errors.confirm_password?.message}
                        touched={!!errors.confirm_password}
                        autoComplete="off"
                        {...field}
                      />
                    )}
                  />

                  <div className="w-1/2 pt-5">
                    <Button
                      type="submit"
                      className="w-full text-sm font-medium rounded"
                      text={isLoading ? <Loader /> : "Reset Password"}
                      ariaLabel="Reset Password Button"
                      disabled={!isValid || isLoading}
                      primary
                    />
                  </div>
                </form>
              </div>

              {/* Sign In Section */}
              <div className="mt-6 mx-2 mb-2 bg-[#EFF7FE] rounded-b-lg py-6 flex items-center justify-center">
                <p className="text-sm text-[#7F7F7F] font-semibold">
                  Remember your password?{" "}
                  <Link
                    href="/onboarding/sign-in"
                    className="text-primary hover:text-blue-700"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer */}
            <AuthFooter />
          </div>
        </motion.div>
      </NoSSR>
    </div>
  );
};

export default ResetPassword;