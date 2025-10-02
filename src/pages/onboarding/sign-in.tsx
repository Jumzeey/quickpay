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
import { useState } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

interface FormValues {
  email: string;
  password: string;
}

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Enter a valid email")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email must have a valid provider"
    )
    .required("Email address is required!"),
  password: Yup.string().required("Password is required!"),
});

const SignInPage: React.FC = () => {
  const router = useRouter();
  const { signIn } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useFormValidation<FormValues>(validationSchema, {
    defaultValues: {
      email: "",
      password: "",
    },
    mode: 'onChange'
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const response = await signIn(values);
      notifySuccess(response.message);
      localStorage.setItem("user-email", values.email);
      router.push({
        pathname: "/onboarding/otp",
        query: { source: "sign-in" },
      });
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-auth bg-opacity-10">
      <WebPageTitle title="Login | Cray Merchant Portal" />
      <NoSSR>
        <motion.div
          className="flex flex-col items-center justify-center "
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
                    height={40}
                    priority
                    className="h-10 w-auto"
                  />
                </div>
              </div>

              {/* Sign In Form */}
              <div className="px-8 pb-8 mt-12">
                <h2 className="text-lg font-extrabold text-[#184078] mb-8">
                  Sign in.
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        label="Work Email Address"
                        id="email"
                        type="email"
                        htmlFor="email"
                        error={errors.email?.message}
                        touched={!!errors.email}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <FormInput
                          label="Password"
                          id="password"
                          type="password"
                          htmlFor="password"
                          error={errors.password?.message}
                          touched={!!errors.password}
                          {...field}
                        />

                        <div className="flex justify-end">
                          <Link
                            href="/onboarding/forgot-password"
                            className="text-[13px] font-semibold text-primary hover:text-blue-700"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                      </div>
                    )}
                  />

                  <div className="w-1/3 pt-5">
                    <Button
                      type="submit"
                      className="w-full text-sm font-medium rounded"
                      text={isLoading ? <Loader /> : "Sign in"}
                      ariaLabel="Sign In Button"
                      disabled={isLoading}
                      primary
                    />
                  </div>
                </form>
              </div>

              {/* Create Account Section */}
              <div className="mt-6 mx-2 mb-2 bg-[#EFF7FE] rounded-b-lg py-6 flex items-center justify-center">
                <p className="text-sm text-[#7F7F7F] font-semibold">
                  New to Cray?
                  <Link
                    href="/onboarding/join-us"
                    className="text-primary hover:text-blue-700 ml-1"
                  >
                    Create an account
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

export default SignInPage;
