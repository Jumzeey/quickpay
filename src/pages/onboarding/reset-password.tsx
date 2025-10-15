import { MultiStepAnimation } from "@/animations";
import { AuthFooter } from "@/components/AuthFooter";
import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import NoSSR from "@/components/noSSR";
import WebPageTitle from "@/components/WebPageTitle";
import { useFormValidation } from "@/hooks/useFormValidation";
import useAuthentication from "@/stores/useAuthentication";
import { notifyError, notifySuccess, passwordValidation } from "@/util/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

interface FormValues {
  password: string;
  password_confirmation: string;
}

const validationSchema = Yup.object().shape({
  password: passwordValidation,
  password_confirmation: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

const ResetPassword: React.FC = () => {
  const router = useRouter();
  const { newPassword } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useFormValidation<FormValues>(validationSchema, {
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        email: localStorage.getItem("user-email"),
      };
      const response = await newPassword(payload);
      notifySuccess(response.message);
      await localStorage.removeItem("user-email");
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
                    render={({ field }) => (
                      <FormInput
                        label="New Password"
                        id="password"
                        type="password"
                        htmlFor="password"
                        error={errors.password?.message}
                        touched={!!errors.password}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    name="password_confirmation"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        label="Confirm Password"
                        id="password_confirmation"
                        type="password"
                        htmlFor="password_confirmation"
                        error={errors.password_confirmation?.message}
                        touched={!!errors.password_confirmation}
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