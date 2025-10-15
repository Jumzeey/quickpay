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
import React, { useState } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

interface FormValues {
  email: string;
}

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Enter a valid email")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email must have a valid provider"
    )
    .required("Email address is required!"),
});

const ForgotPassword: React.FC = () => {
  const router = useRouter();
  const { forgotPassword } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useFormValidation<FormValues>(validationSchema, {
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const response = await forgotPassword({ email: values.email });
      notifySuccess(response.message);
      localStorage.setItem("user-email", values.email);
      router.push({
        pathname: "/onboarding/otp",
        query: { source: "forgot-password" },
      });
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-auth bg-opacity-10">
      <WebPageTitle title="Forgot Password | Cray Merchant Portal" />
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

              {/* Forgot Password Form */}
              <div className="px-8 pb-8 mt-12">
                <h2 className="text-lg font-extrabold text-[#184078] mb-2">
                  Request Password Reset
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        label="Email address"
                        id="email"
                        type="email"
                        htmlFor="email"
                        error={errors.email?.message}
                        touched={!!errors.email}
                        {...field}
                      />
                    )}
                  />

                  <div className="w-1/2 pt-5">
                    <Button
                      type="submit"
                      className="w-full text-sm font-medium rounded"
                      text={isLoading ? <Loader /> : "Send request email"}
                      ariaLabel="Reset Password Button"
                      disabled={isLoading}
                      primary
                    />
                  </div>
                </form>
              </div>

              {/* Sign In Section */}
              <div className="mt-6 mx-2 mb-2 bg-[#EFF7FE] rounded-b-lg py-6 flex items-center justify-center">
                <p className="text-sm text-[#7F7F7F] font-semibold">
                  Remember account password?
                  <Link
                    href="/onboarding/sign-in"
                    className="text-primary hover:text-blue-700 ml-1"
                  >
                    Sign In
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

export default ForgotPassword;