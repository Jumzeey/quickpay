import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import Loader from "@/components/loader";
import { useFormValidation } from "@/hooks/useFormValidation";
import useAuthentication from "@/stores/useAuthentication";
import { notifyError, notifySuccess, passwordValidation } from "@/util/utils";
import { useState } from "react";
import * as Yup from "yup";

type FormValues = {
  password: string;
  password_confirmation: string;
}

const validationSchema = Yup.object().shape({
  // reset_token: Yup.string().required("Reset Token is required"),
  password: passwordValidation,
  password_confirmation: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

const SecurityTab = () => {
  const { user, newPassword } = useAuthentication();
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
      <div className="flex items-center border-b border-[#C4C4C452] p-4">
        <div className="text-left gap-2">
          <h3 className="text-base md:text-lg font-semibold text-black">Change Password</h3>
          <p className="text-[13px] text-[#7F7F7F] font-medium">
            We’ll send a confirmation to your email address <em className="font-semibold">{user?.email}</em>
          </p>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 my-4">
            <div className="w-full md:w-1/2">
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

            <div className="w-full md:w-1/2">
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