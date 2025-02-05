import React, { useState } from "react";
import Card from "@/components/Card";
import Button from "../button";
import Modal from "../modal";
import FloatingLabelInput from "../floating-input";
import { notifyError, notifySuccess } from "@/util/utils";
import Loader from "../loader";
import { useRouter } from "next/router";
import useAuthentication from "@/stores/useAuthentication";
import { useFormik } from "formik";
import * as Yup from "yup";

const SecurityTab = () => {
  const router = useRouter();
  const { newPassword } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const userEmail =
    typeof window !== "undefined" ? localStorage?.getItem("user-email") : "";

  const passwordValidation = Yup.string()
    .required("Password is required!")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one symbol."
    )
    .matches(/\d/, "Password must contain at least one number.")
    .min(12, "Password must be at least 12 characters long")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter");

  const formik = useFormik({
    initialValues: {
      password: "",
      password_confirmation: "",
    },
    validationSchema: Yup.object().shape({
      password: passwordValidation,
      password_confirmation: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Confirm Password is required"),
    }),
    validateOnMount: true,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    const payload = {
      email: userEmail,
      password: values.password,
      password_confirmation: values.password_confirmation,
    };
    try {
      const response = await newPassword(payload);
      notifySuccess(response.message);
      setIsLoading(false);
      closeModal();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card className="w-full md:w-[477px] !rounded-xl p-6">
        <h6 className="font-bold">Password</h6>
        <p className="font-thin mt-3">
          We’ll send instruction to your email address{" "}
          <span className="sarepayPrimary font-bold">{userEmail}</span> to
          change your password
        </p>
        <div className="mt-5">
          <Button
            text="Change Password"
            ariaLabel="Change Password Button"
            className="w-full"
            onClick={openModal}
            small
            primary
          />
        </div>
      </Card>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div>
          <h6 className="font-bold text-2xl">Change Password</h6>
          <p className="mt-5 font-thin">
            Reduce your risk of exposure by changing your password.
          </p>
          <form onSubmit={formik.handleSubmit} className="mt-10">
            <FloatingLabelInput
              label="Password"
              id="password"
              type="password"
              htmlFor="password"
              formik={formik}
              {...formik.getFieldProps("password")}
            />
            <FloatingLabelInput
              label="New Password"
              id="password_confirmation"
              type="password"
              htmlFor="password_confirmation"
              formik={formik}
              {...formik.getFieldProps("password_confirmation")}
            />
            <span className="font-thin block mt-2">
              Tip: Using a passphrase of random words (like: S3ndc@shdear) is
              secure and easy to remember
            </span>
            <div className="flex justify-center mt-5">
              <Button
                className="w-full"
                text={isLoading ? <Loader /> : "Change Password"}
                ariaLabel="Change Password Button"
                disabled={isLoading}
                primary
                type="submit"
              />
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default SecurityTab;
