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
import { MultiStepAnimation } from "@/animations";
import { motion } from "framer-motion";

const SignInPage: React.FC = () => {
  const router = useRouter();
  const { signIn } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object().shape({
      email: Yup.string()
        .email("Enter a valid email")
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Email must have a valid provider"
        )
        .required("Email address is required!"),
      password: Yup.string().required("Password is required!"),
    }),
    validateOnMount: true,
    onSubmit: async values => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    const payload = {
      email: values.email,
      password: values.password,
    };
    try {
      const response = await signIn(payload);
      notifySuccess(response.message);
      setIsLoading(false);
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
    <div className="w-full min-h-screen flex justify-center text-white bg-ramp">
      <WebPageTitle title="Login | Ramp Merchant Portal" />
      <NoSSR>
        <div className="w-full lg:w-1/2 md:w-1/2 p-4 lg:p-32 lg:py-10 bg-black/20 backdrop-blur-sm shadow-lg">
          <motion.div
            className=""
            variants={MultiStepAnimation}
            initial="hidden"
            animate="visible"
          >
            <div className="flex justify-center items-center w-full ">
              <Image
                src="/images/ramp-logo.svg"
                alt="ramp-logo"
                width={200}
                height={50}
                priority
              />
            </div>
            <div className="mt-52">
              <h1 className="font-semibold text-2xl">Sign In</h1>
              <p className="font-light text-sm mt-2 mb-2">
                Kindly provide your login details
              </p>
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
                <Link
                  href="/onboarding/forgot-password"
                  className="sarepayPrimary text-sm font-medium flex justify-end"
                >
                  <span className="underline-animation text-white">
                    Forgot Password
                  </span>
                </Link>

                <div className="flex justify-center mt-12">
                  <Button
                    text={isLoading ? <Loader /> : "Sign In"}
                    ariaLabel="Sign In Button"
                    disabled={isLoading}
                    primary
                  />
                </div>
              </form>
              <div className="flex justify-center gap-1 mt-5">
                <Image
                  src={"/images/lock.svg"}
                  alt={"locked"}
                  width={14}
                  height={14}
                  priority
                />
                <span className="infoGrey text-xs">
                  Your Info is safely secured
                </span>
              </div>
            </div>

            <div className="flex w-full justify-end my-5">
              <h6 className="text-sm">
                Don&apos;t have an account?
                <Link
                  href="/onboarding/join-us"
                  className="underline-animation text-white font-medium ml-1"
                >
                  Sign Up
                </Link>
              </h6>
            </div>
          </motion.div>
        </div>
      </NoSSR>
    </div>
  );
};

export default SignInPage;
