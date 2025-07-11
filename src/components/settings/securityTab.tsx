import ActionButton from "@/components/action-button";
import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import { useFormValidation } from "@/hooks/useFormValidation";
import useAuthentication from "@/stores/useAuthentication";
import { notifyError, notifySuccess } from "@/util/utils";
import { useState } from "react";
import * as Yup from "yup";

type FormValues = {
  // reset_token: string;
  password: string;
  password_confirmation: string;
}

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

const validationSchema = Yup.object().shape({
  // reset_token: Yup.string().required("Reset Token is required"),
  password: passwordValidation,
  password_confirmation: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

const SecurityTab = () => {
  const { user } = useAuthentication();
  const { newPassword } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    reset,
    watch
  } = useFormValidation(validationSchema, {
    defaultValues: {
      // reset_token: "",
      password: "",
      password_confirmation: "",
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const payload = {
        email: user?.email,
        // reset_token: values.reset_token,
        password: values.password,
        password_confirmation: values.password_confirmation,
      };
      const response = await newPassword(payload);
      notifySuccess(response.message);
      reset();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-[#C4C4C452] p-4">
        <div className="text-left gap-2">
          <h3 className="text-lg font-semibold text-black">Change Password</h3>
          <p className="text-[13px] text-[#7F7F7F] font-medium">
            We’ll send a password reset token to your email address {user?.email}
          </p>
        </div>

        <ActionButton
          ariaLabel="Send Password Reset Email"
          text="Send Email"
          className="!h-10 !px-4 !font-medium"
        />
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* <div className="w-1/2">
            <FormInput
              label="Password Reset Token"
              id="reset_token"
              type="text"
              htmlFor="reset_token"
              error={errors.reset_token?.message}
              touched={touchedFields.reset_token}
              {...register("reset_token")}
            />
          </div> */}

          <div className="space-y-6 my-4">
            <div className="w-1/2">
              <FormInput
                label="New Password"
                id="password"
                type="password"
                htmlFor="password"
                error={errors.password?.message}
                touched={touchedFields.password}
                {...register("password")}
              />
            </div>

            <div className="w-1/2">
              <FormInput
                label="Confirm Password"
                id="password_confirmation"
                type="password"
                htmlFor="password_confirmation"
                error={errors.password_confirmation?.message}
                touched={touchedFields.password_confirmation}
                {...register("password_confirmation")}
              />
            </div>
          </div>

          <div className="w-[183px] mt-14">
            <Button
              className="w-full"
              text={isLoading ? <Loader /> : "Update Password"}
              ariaLabel="Update Password Button"
              disabled={isLoading}
              primary
              type="submit"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecurityTab;