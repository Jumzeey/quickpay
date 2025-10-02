import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import FormPhoneInput from "@/components/FormPhoneInput";
import FormSelectSearch from "@/components/FormSelectSearch";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import NoSSR from "@/components/noSSR";
import WebPageTitle from "@/components/WebPageTitle";
import { useFormValidation } from "@/hooks/useFormValidation";
// import { SupportedCountry } from "@/services/authentication";
import useAuthentication from "@/stores/useAuthentication";
import useLoadRecaptcha from "@/util/useLoadRecaptcha";
import { notifyError, notifySuccess, passwordValidation } from "@/util/utils";
import { getData } from "country-list";
import countryToCurrency, { Countries, Currencies } from "country-to-currency";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

interface FormValues {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  password_confirmation: string;
  business_name: string;
  agree_to_terms: boolean;
}

const validationSchema = Yup.object().shape({
  firstname: Yup.string().required("First Name is required!"),
  lastname: Yup.string().required("Last Name is required!"),
  email: Yup.string()
    .email("Enter a valid email")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email must have a valid provider"
    )
    .required("Email address is required!"),
  phone: Yup.string().required("Phone number is required!"),
  country: Yup.string().required("Country is required!"),
  business_name: Yup.string().required("Business Name is required!"),
  password: passwordValidation,
  password_confirmation: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
  agree_to_terms: Yup.boolean()
    .oneOf([true], "You must agree to the terms")
    .required("You must agree to the terms"),
});

const RegisterPage = () => {
  const router = useRouter();
  const {
    signUp,
    getSupportedCountries,
    supportedCountries,
    supportedCountriesLoading
  } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load supported countries on component mount
  // useEffect(() => {
  //   async function fetchSupportedCountries() {
  //     try {
  //       const response = await getSupportedCountries();
  //       console.log('Supported countries loaded:', response);
  //     } catch (error) {
  //       console.error('Failed to load supported countries:', error);
  //       // Fallback to country-list if API fails
  //     }
  //   }

  //   fetchSupportedCountries();
  // }, [getSupportedCountries]);

  // Fallback countries from country-list package
  const countries = useMemo(() =>
    getData().map(country => ({
      value: country.code,
      label: country.name
    })), []
  );

  // const countries = useMemo(() => {
  //   if (supportedCountries && supportedCountries.length > 0) {
  //     return supportedCountries.map((country: any) => ({
  //       value: country.code,
  //       label: country.label
  //     }));
  //   }
  //   return fallbackCountries;
  // }, [supportedCountries, fallbackCountries]);

  // console.log({countries, supportedCountries, fallbackCountries})

  useLoadRecaptcha();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useFormValidation<FormValues>(validationSchema, {
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      country: "NG",
      password: "",
      password_confirmation: "",
      business_name: "",
      agree_to_terms: false
    },
    mode: "onChange"
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const token = await window.grecaptcha?.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
        { action: "submit" }
      );

      const response = await signUp({
        ...values,
        currency: countryToCurrency[values.country as Countries] as Currencies || 'NGN',
        business_type: "starter",
        recaptchaToken: token
      });

      notifySuccess(response.message);
      setShowSuccessModal(true);
      reset();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-auth bg-opacity-10">
      <WebPageTitle title="Register | Cray Merchant Portal" />
      <NoSSR>
        <div className="w-full max-w-2xl mx-auto">
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

            {/* Registration Form */}
            <div className="px-8 pb-8 mt-12">
              <div className="space-y-2 mb-8">
                <h2 className="text-lg font-extrabold text-[#184078]">
                  Create account
                </h2>
                <p className="text-sm font-semibold text-[#00000080]">
                  Creating your business account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="firstname"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        label="First Name"
                        id="firstname"
                        type="text"
                        htmlFor="firstname"
                        error={errors.firstname?.message}
                        touched={!!errors.firstname}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    name="lastname"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        label="Last Name"
                        id="lastname"
                        type="text"
                        htmlFor="lastname"
                        error={errors.lastname?.message}
                        touched={!!errors.lastname}
                        {...field}
                      />
                    )}
                  />
                </div>

                <Controller
                  name="business_name"
                  control={control}
                  render={({ field }) => (
                    <FormInput
                      label="Business Name"
                      id="business_name"
                      type="text"
                      htmlFor="business_name"
                      error={errors.business_name?.message}
                      touched={!!errors.business_name}
                      {...field}
                    />
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <FormPhoneInput
                        label="Phone Number"
                        id="phone"
                        htmlFor="phone"
                        error={errors.phone?.message}
                        touched={!!errors.phone}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        label="Email Address"
                        id="email"
                        type="email"
                        htmlFor="email"
                        error={errors.email?.message}
                        touched={!!errors.email}
                        {...field}
                      />
                    )}
                  />
                </div>

                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <FormSelectSearch
                      placeholder=""
                      // placeholder={supportedCountriesLoading ? "Loading countries..." : "Select country"}
                      label="Country"
                      id="country"
                      htmlFor="country"
                      options={countries}
                      error={errors.country?.message}
                      touched={!!errors.country}
                      // disabled={supportedCountriesLoading}
                      {...field}
                    />
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        label="Password"
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
                </div>

                <Controller
                  name="agree_to_terms"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2 items-start cursor-pointer">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          id="agree_to_terms"
                          className="w-[15px] h-[15px] appearance-none rounded-full border-[1.5px] border-[#7F7F7F] checked:bg-primary checked:border-primary focus:outline-none mt-1"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </div>
                      <label htmlFor="agree_to_terms" className="text-sm font-medium text-[#7F7F7F] leading-snug">
                        I consent to the collection and processing of my personal data in line with data regulations as
                        described in the{' '}
                        <Link href="/privacy-policy" className="text-primary">
                          Cray Privacy Policy
                        </Link>.
                      </label>
                    </div>
                  )}
                />

                {errors.agree_to_terms && (
                  <p className="text-danger font-medium text-xs mt-1">{errors.agree_to_terms.message}</p>
                )}

                <div className="w-1/4">
                  <Button
                    type="submit"
                    className="w-full py-2.5 text-sm font-medium rounded"
                    text={isLoading ? <Loader /> : "Sign up"}
                    ariaLabel="Sign up Button"
                    disabled={isLoading || supportedCountriesLoading}
                    primary
                  />
                </div>
              </form>
            </div>

            {/* Sign In Section */}
            <div className="mt-6 mx-2 mb-2 bg-[#EFF7FE] rounded-b-lg py-6 flex items-center justify-center">
              <p className="text-sm text-[#7F7F7F] font-semibold">
                Already have an account?{" "}
                <Link
                  href="/onboarding/sign-in"
                  className="text-primary hover:text-blue-700 ml-1"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </NoSSR>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <Image
              src="/images/circle-check-full.svg"
              alt="Success"
              width={32}
              height={32}
            />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Registration Successful</h3>
          <p className="mt-2 text-sm text-gray-500">
            Please check your email to verify your account
          </p>
          <div className="mt-4">
            <Button
              onClick={() => router.push("/onboarding/sign-in")}
              text="Go to Sign In"
              ariaLabel="Go to Sign In"
              primary
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegisterPage;