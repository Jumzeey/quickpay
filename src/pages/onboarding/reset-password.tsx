import Sidebar from "@/components/onboarding/sidebar";
import Button from "@/components/button";
import Image from "next/image";
import useAuthentication from "@/stores/useAuthentication";
import { useRouter } from "next/router";
import Link from "next/link";
import * as Yup from "yup";
import { notifyError, notifySuccess } from "@/util/utils";
import { useFormik } from "formik";
import { useState } from "react";
import FloatingLabelInput from "@/components/floating-input";
import NoSSR from "@/components/noSSR";
import Loader from "@/components/loader";
import WebPageTitle from "@/components/WebPageTitle";
import { motion } from "framer-motion";
import { MultiStepAnimation } from "@/animations";

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const { newPassword } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const passwordValidation = Yup.string()
    .required("Password is required!")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one symbol.")
    .matches(/\d/, "Password must contain at least one number.")
    .min(12, "Password must be at least 12 characters long")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      password_confirmation: "",
    },
    validationSchema: Yup.object().shape({
      email: Yup.string()
        .email("Enter a valid email")
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Email must have a valid provider"
        )
        .required("Email address is required!"),
      password: passwordValidation,
      password_confirmation: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Confirm Password is required'),
    }),
    validateOnMount: true,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    const payload = {
      email: values.email,
      password: values.password,
      password_confirmation: values.password_confirmation,
    };
    try {
      const response = await newPassword(payload);
      notifySuccess(response.message);
      setIsLoading(false);
      router.push({
        pathname: "/onboarding/sign-in",
      });
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full">
      <WebPageTitle title="Login | Sarepay Merchant Portal" />
      <Sidebar />
      <NoSSR>
        <div className="w-full lg:w-1/2 md:w-1/2 p-4 lg:p-32 lg:py-10">
          <div className="flex w-full justify-end">
            <h6 className="font-thin text-sm">
              Already have an account? <Link href="/onboarding/sign-in" className="font-bold sarepayPrimary underline-animation">Sign In</Link>
            </h6>
          </div>
          <motion.div
            className="mt-48"
            variants={MultiStepAnimation}
            initial="hidden"
            animate="visible"
          >
          <div>
            <h1 className="font-bold text-2xl">Reset Password</h1>
            <p className="font-light text-sm mt-2 mb-2">Kindly provide your new password</p>
            <form onSubmit={formik.handleSubmit} className="mt-10">
              <FloatingLabelInput
                label="Email Address"
                id="email"
                type="email"
                htmlFor="email"
                formik={formik}
                {...formik.getFieldProps("email")}
              />
              <FloatingLabelInput
                label="Password"
                id="password"
                type="password"
                htmlFor="password"
                formik={formik}
                {...formik.getFieldProps("password")}
              />
              <FloatingLabelInput
                label="Confirm Password"
                id="password_confirmation"
                type="password"
                htmlFor="password_confirmation"
                formik={formik}
                {...formik.getFieldProps("password_confirmation")}
              />

              <div className="flex justify-center mt-12">
                <Button
                  text={isLoading ? <Loader /> : "Reset Password"}
                  ariaLabel="Reset Password Button"
                  disabled={isLoading}
                  primary
                />
              </div>
            </form>
            <div className="flex justify-center mt-5">
              <Image
                src={"/images/lock.svg"}
                alt={"locked"}
                width={10}
                height={24}
                priority
              />
              <span className="ml-3 infoGrey text-xs">
                Your Info is safely secured
              </span>
            </div>
          </div>
          </motion.div>
        </div>
      </NoSSR>
    </div>
  );
};

export default ResetPasswordPage;
