import { MultiStepAnimation } from '@/animations';
import Button from '@/components/button';
import FloatingLabelInput from '@/components/floating-input';
import FloatingLabelPhoneInput from '@/components/FloatingPhoneInput';
import FormSelectSearch from '@/components/FormSelectSearch';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import WebPageTitle from '@/components/WebPageTitle';
import env from '@/config/env';
import useAuthentication from '@/stores/useAuthentication';
import useLoadRecaptcha from '@/util/useLoadRecaptcha';
import {
  capitalizeFirstLetter,
  // nigerianPhoneNumberSchema,
  notifyError,
} from '@/util/utils';
import { getData, getName } from 'country-list';
import { useFormik } from 'formik';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

type RegisterType = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  country: string;
  // bvn: string;
  cac_document: string;
  nin: string;
  registration_number: string;
  password: string;
  password_confirmation: string;
  business_name: string;
  business_type: string;
  agree_to_terms: boolean;
};

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { signUp } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasSymbol: false,
    hasNumber: false,
    hasMinLength: false,
    hasLowercase: false,
    hasUppercase: false,
  });
  const [register, setRegister] = useState<RegisterType>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    country: 'NG',
    // bvn: "",
    cac_document: '',
    nin: '',
    registration_number: '',
    password: '',
    password_confirmation: '',
    business_name: '',
    business_type: params?.business as string,
    agree_to_terms: false,
  });

  const navigateBack = () => {
    router.back();
  };
  const { publicUrl } = env;

  const countries = getData().map(country => ({
    value: country.code,
    label: country.name
  }));

  const capitalizedBusiness =
    typeof params?.business === 'string'
      ? capitalizeFirstLetter(params?.business)
      : Array.isArray(params?.business) && params?.business.length > 0
        ? capitalizeFirstLetter(params?.business[0])
        : '';

  const passwordValidation = Yup.string()
    .required('Password is required!')
    .matches(
      /[!@#$%^&*(),.?":{}|<>=-]/,
      'Password must contain at least one symbol .'
    )
    .matches(/\d/, 'Password must contain at least one number.')
    .min(8, 'Password must be at least 8 characters long')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter');

  const formik = useFormik({
    initialValues: {
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      country: 'NG',
      // bvn: "",
      cac_document: '',
      nin: '',
      registration_number: '',
      password: '',
      password_confirmation: '',
      business_name: '',
      agree_to_terms: false,
      business_type: params?.business,
    },
    validationSchema: Yup.object().shape({
      firstname: Yup.string().required('First Name is required!'),
      lastname: Yup.string().required('Last Name is required!'),
      phone: Yup.string().required('Phone number is required!'),
      country: Yup.string().required('Country is required!'),
      // bvn: Yup.string()
      //   .required("BVN is required!")
      //   .matches(/^\d{11}$/, "BVN must be exactly 11 digits"),
      nin: Yup.string().matches(/^\d{11}$/, 'NIN must be exactly 11 digits'),
      cac_document: Yup.string(),
      registration_number: Yup.string(),
      email: Yup.string()
        .email('Enter a valid email')
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          'Email must have a valid provider'
        )
        .required('Email address is required!'),
      password: passwordValidation,
      password_confirmation: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Confirm Password is required'),
      business_name: Yup.string().required('Business Name is required!'),
      agree_to_terms: Yup.boolean()
        .oneOf([true], 'You must agree to the terms before proceeding')
        .required('You must agree to the terms'),
    }),
    validateOnMount: true,
    onSubmit: async values => {
      handleSubmit(values);
    },
  });

  useLoadRecaptcha();

  const recaptchaToken = async (): Promise<string | null> => {
    if (!window.grecaptcha) {
      console.error('reCAPTCHA is not loaded yet.');
      return null;
    }

    try {
      const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      return await window.grecaptcha.execute(recaptchaSiteKey, {
        action: 'submit',
      });
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return null;
    }
  };

  const handleSubmit = async (values: any) => {
    setIsLoading(true);

    try {
      const token = await recaptchaToken();
      if (!token) {
        notifyError('Failed to verify reCAPTCHA. Please try again.');
        setIsLoading(false);
        return;
      }

      const payload = {
        firstname: values.firstname,
        lastname: values.lastname,
        email: values.email,
        phone: values.phone,
        country: getName(values.country),
        password: values.password,
        password_confirmation: values.password_confirmation,
        business_name: values.business_name,
        agree_to_terms: values.agree_to_terms,
        business_type: 'starter',
        recaptchaToken: token,
      };

      const response = await signUp(payload);
      formik.resetForm();
      setSuccessModal(true);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update password requirements
  const checkPasswordRequirements = (password: string) => {
    setPasswordRequirements({
      hasSymbol: /[!@#$%^&*(),.?":{}|<>=-]/.test(password),
      hasNumber: /\d/.test(password),
      hasMinLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
    });
  };

  useEffect(() => {
    checkPasswordRequirements(formik.values.password);
  }, [formik.values.password]);
  return (
    <>
      <div className='w-full min-h-screen flex justify-center text-white bg-ramp'>
        <WebPageTitle title='Join Us | Ramp Merchant Portal' />
        {/* <Sidebar /> */}
        <div className='w-full lg:w-1/2 md:w-1/2 p-4 lg:p-32 lg:py-10 bg-black/20 backdrop-blur-sm shadow-lg'>
          <div className='flex w-full justify-between'>
            <div className='flex cursor-pointer' onClick={navigateBack}>
              <Image
                src='/images/arrow-back.svg'
                width={15}
                height={5}
                onClick={() => router.back()}
                alt='Back Icon'
              />
              <span className='ml-1 font-light'>Back</span>
            </div>
            <Link href='/onboarding/sign-in'>
              <h6 className='font-light text-sm'>
                Already have an account?
                <span className='font-medium ml-1 text-white underline-animation'>
                  Sign In
                </span>
              </h6>
            </Link>
          </div>
          <motion.div
            className='mt-10'
            variants={MultiStepAnimation}
            initial='hidden'
            animate='visible'
          >
            <form onSubmit={formik.handleSubmit}>
              <h1 className='text-2xl font-semibold'>
                Create {capitalizedBusiness} a Business Account!
              </h1>
              {/* <p className="font-light mt-1 mb-5">
                For the purpose of industry regulation, your details are
                required.
              </p> */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10'>
                <FloatingLabelInput
                  label='First Name'
                  id='firstname'
                  type='text'
                  htmlFor='firstname'
                  formik={formik}
                  {...formik.getFieldProps('firstname')}
                />
                <FloatingLabelInput
                  label='Last Name'
                  id='lastname'
                  type='text'
                  htmlFor='lastname'
                  formik={formik}
                  {...formik.getFieldProps('lastname')}
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <FloatingLabelInput
                  label='Business Name'
                  id='business_name'
                  type='text'
                  htmlFor='business_name'
                  formik={formik}
                  {...formik.getFieldProps('business_name')}
                />
                <FloatingLabelPhoneInput formik={formik} label='Phone Number' />
                {/* <div className='flex'>
                  <div className="border-[1px] border-[#dcdcdc] rounded-md h-[60px] flex justify-center items-center px-[0.8rem] mr-2 bg-white">
                    <Image
                      src="/images/nigeria.svg"
                      width={14}
                      height={14}
                      alt="Nigeria Icon"
                    />
                    <span className="text-[#49454F] ml-1 text-[12px]">
                      +234
                    </span>
                  </div>
                  <FloatingLabelInput
                    label='Phone Number'
                    id='phone'
                    type='text'
                    htmlFor='phone'
                    formik={formik}
                    {...formik.getFieldProps('phone')}
                    maxLength={11}
                    numberOnly
                  />
                </div> */}
              </div>
              {/* <FloatingLabelInput
                label="BVN"
                id="bvn"
                type="text"
                htmlFor="bvn"
                formik={formik}
                maxLength={11}
                {...formik.getFieldProps("bvn")}
                numberOnly
              /> */}
              <FloatingLabelInput
                label='Email Address'
                id='email'
                type='email'
                htmlFor='email'
                formik={formik}
                {...formik.getFieldProps('email')}
              />

              <div className="pb-6 text-black">
                <FormSelectSearch
                  label=""
                  id="country"
                  htmlFor="country"
                  options={countries}
                  value={formik.values.country}
                  onChange={(value) => formik.setFieldValue('country', value)}
                  // onBlur={formik.handleBlur}
                  name="country"
                  placeholder="Search countries"
                  error={formik.errors.country}
                  touched={!!formik.touched.country}
                />
              </div>

              <FloatingLabelInput
                label='Password'
                id='password'
                type='password'
                htmlFor='password'
                formik={formik}
                {...formik.getFieldProps('password')}
                showError={false}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              {isPasswordFocused && (
                <ul className='mb-4 font-bold text-[12px] list-disc list-inside'>
                  <li
                    className={
                      passwordRequirements.hasSymbol
                        ? 'text-[green] text-[10px]'
                        : 'text-[10px] text-[red]'
                    }
                  >
                    Password must contain at least one symbol.
                  </li>
                  <li
                    className={
                      passwordRequirements.hasNumber
                        ? 'text-[green] text-[10px]'
                        : 'text-[10px] text-[red]'
                    }
                  >
                    Password must contain at least one number.
                  </li>
                  <li
                    className={
                      passwordRequirements.hasMinLength
                        ? 'text-[green] text-[10px]'
                        : 'text-[10px] text-[red]'
                    }
                  >
                    Password must be at least 8 characters long.
                  </li>
                  <li
                    className={
                      passwordRequirements.hasLowercase
                        ? 'text-[green] text-[10px]'
                        : 'text-[10px] text-[red]'
                    }
                  >
                    Password must contain at least one lowercase letter.
                  </li>
                  <li
                    className={
                      passwordRequirements.hasUppercase
                        ? 'text-[green] text-[10px]'
                        : 'text-[10px] text-[red]'
                    }
                  >
                    Password must contain at least one uppercase letter.
                  </li>
                </ul>
              )}

              <FloatingLabelInput
                label='Password Confirmation'
                id='password_confirmation'
                type='password'
                htmlFor='password_confirmation'
                formik={formik}
                {...formik.getFieldProps('password_confirmation')}
              />
              <div className='flex items-center'>
                <input
                  id='agree_to_terms'
                  type='checkbox'
                  className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                  checked={formik.values.agree_to_terms}
                  onChange={formik.handleChange}
                />
                <label
                  htmlFor='agree_to_terms'
                  className='ml-2 block text-sm text-gray-900'
                >
                  I consent to the collection and processing of my personal data
                  in line with data regulations as described in the Ramp Privacy
                  Policy
                  {/* <Link href={`${publicUrl}/privacy-policy`} legacyBehavior>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 font-medium underline-animation cursor-pointer"
                    >
                      Ramp Privacy Policy
                    </a>
                  </Link> */}
                </label>
              </div>
              {formik.touched.agree_to_terms && formik.errors.agree_to_terms ? (
                <div className='text-danger inline-block text-xs font-medium pt-1'>
                  {formik.errors.agree_to_terms}
                </div>
              ) : null}
              <div className='flex justify-center mt-5'>
                <Button
                  className='w-full'
                  text={isLoading ? <Loader /> : 'Sign Up'}
                  ariaLabel='Sign Up Button'
                  disabled={isLoading}
                  primary
                />
              </div>

              <div className='flex justify-center mt-5'>
                <Image
                  src={'/images/lock.svg'}
                  alt={'locked'}
                  width={10}
                  height={24}
                  priority
                />
                <span className='ml-3 infoGrey text-xs'>
                  Your Info is safely secured
                </span>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
      <Modal isOpen={successModal}>
        <div className='w-full flex justify-center'>
          <Image
            src='/images/circle-check-full.svg'
            alt='check-image'
            width={100}
            height={100}
            priority
          />
        </div>
        <h6 className='text-center font-bold mt-5 text-2xl'>Success</h6>
        <p className=' mt-5 text-center'>
          A Verification Link Has Been Sent To Your Email. <br />
          <span className='sarepayPrimary'>{register?.email}</span>
        </p>
        <div className='mt-5'>
          <Button
            ariaLabel='Log In'
            text='Log In'
            primary
            onClick={() => {
              router.push('/onboarding/sign-in');
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default RegisterPage;
// import React, { useState } from "react";
// import Sidebar from "@/components/onboarding/sidebar";
// import Image from "next/image";
// import BoxComponent from "@/components/box";
// import { useRouter } from "next/router";
// import Link from "next/link";
// import Button from "@/components/button";
// import Modal from "@/components/modal";
// import NoSSR from "@/components/noSSR";
// import WebPageTitle from "@/components/WebPageTitle";
// import { MultiStepAnimation } from "@/animations";
// import { motion } from "framer-motion";

// const JoinUsPage: React.FC = () => {
//   const router = useRouter();
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isNINModalOpen, setIsNINModalOpen] = useState(false);
//   const openModal = () => setIsModalOpen(true);
//   const closeModal = () => setIsModalOpen(false);
//   const openNINModal = () => setIsNINModalOpen(true);
//   const closeNINModal = () => setIsNINModalOpen(false);

//   const navigateBack = () => {
//     router.back();
//   };

//   return (
//     <NoSSR>
//       <WebPageTitle title="Join Us | Ramp Merchant Portal" />
//       <div className="w-full min-h-screen flex justify-center text-white bg-ramp">
//         <div className="flex w-full min-h-screen justify-center">
//           {/* <Sidebar /> */}
//           <div className="w-full lg:w-1/2 md:w-1/2 p-4 lg:p-32 lg:py-10 bg-black/20 backdrop-blur-sm shadow-lg">
//             <div className="flex w-full justify-between">
//               <div
//                 className="flex cursor-pointer"
//                 onClick={navigateBack}
//               >
//                 <Image
//                   src="/images/arrow-back.svg"
//                   width={15}
//                   height={5}
//                   onClick={() => router.back()}
//                   alt="Back Icon"
//                 />
//                 <span className="ml-1 font-light">Back</span>
//               </div>
//             </div>
//             <motion.div
//               className="mt-10"
//               variants={MultiStepAnimation}
//               initial="hidden"
//               animate="visible"
//             >
//               <div>
//                 <h1 className="font-semibold text-2xl">Join Us!</h1>
//                 <p className="font-light mt-1 text-sm">
//                   Choose the best account type for you
//                 </p>
//                 <div className="mt-10 flex flex-col gap-10">
//                   <BoxComponent
//                     imageUrl1="/images/starter.svg"
//                     headerText="Starter Business"
//                     descriptionText="For Started Business:"
//                     firstItem="A government-issued ID"
//                     // secondItem="Bank Verification Number (BVN)"
//                     imageUrl2="/images/next-icon-alt.svg"
//                     businessType="starter"
//                     onClick={() => router.push("/onboarding/join-us/starter")}
//                   />
//                   <BoxComponent
//                     imageUrl1="/images/registered.svg"
//                     headerText="Registered business account"
//                     descriptionText="For registered businesses with corporate account information:"
//                     firstItem="A government-issued ID"
//                     // secondItem="Bank Verification Number (BVN)"
//                     thirdItem="Business Registration Number"
//                     imageUrl2="/images/next-icon-alt.svg"
//                     businessType="registered"
//                     onClick={() =>
//                       router.push("/onboarding/join-us/registered")
//                     }
//                   />

//                   {/* <BoxComponent
//                 imageUrl1="/images/non-profit.svg"
//                 headerText="Non-profit Entites"
//                 descriptionText="For charity organisations, NGOs, Churches, Mosques and others:"
//                 firstItem="A government-issued ID"
//                 secondItem="Bank Verification Number (BVN)"
//                 thirdItem="CAC Registration Certificate"
//                 fourthItem="Constitution/Memorandum of Guidance. "
//                 imageUrl2="/images/next-icon.svg"
//                 businessType="non-profit"
//                 onClick={() => router.push("/onboarding/join-us/non-profit")}
//               /> */}
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </div>
//       <Modal isOpen={isModalOpen} onClose={closeModal}>
//         <div className="flex">
//           <div className="w-3/12">
//             <Image
//               src="/images/cac.svg"
//               alt="CAC Registration Certificate Image"
//               width="100"
//               height="100"
//               priority
//             />
//           </div>
//           <div>
//             <h3 className="openSansBold text-lg">
//               Enter Business Registration Number
//             </h3>
//             <p className="text-sm openSansRegular mt-3">
//               Get the latest Lorem Ipsum is simply dummy text of the printing
//               and typesetting industry.
//             </p>

//             <div className="relative mt-2 rounded-md shadow-sm">
//               <input
//                 type="text"
//                 name="nin"
//                 id="nin"
//                 className="block w-full text-gray-900 placeholder:text-gray-400 rounded-md bg-[#F4F6F9] p-[0.3rem]"
//                 placeholder=""
//               />
//               <div className="absolute inset-y-0 right-0 flex items-center">
//                 <Button
//                   text="Continue"
//                   ariaLabel="Continue"
//                   onClick={openModal}
//                   primary
//                 />
//               </div>
//             </div>
//             <div className="mt-5">
//               {/* <UploadComponent onFileChange={handleFileChange} /> */}
//             </div>
//           </div>
//         </div>
//       </Modal>

//       <Modal isOpen={isNINModalOpen} onClose={closeNINModal}>
//         <div className="flex">
//           <div className="w-3/12">
//             <div className="w-full">
//               <Image
//                 src="/images/nimc.svg"
//                 alt="CAC Registration Certificate Image"
//                 width="100"
//                 height="100"
//                 priority
//               />
//             </div>
//           </div>
//           <div className="w-3/4">
//             <h3 className="text-lg">Enter Your NIN</h3>
//             <p className="text-sm mt-2">Enter the BVN of the Business Owner.</p>
//             <div className="mt-5">
//               <div className="relative mt-2 rounded-md shadow-sm">
//                 <input
//                   type="text"
//                   name="nin"
//                   id="nin"
//                   className="block w-full text-gray-900 placeholder:text-gray-400 rounded-md bg-[#F4F6F9] p-[0.3rem]"
//                   placeholder=""
//                 />
//                 <div className="absolute inset-y-0 right-0 flex items-center">
//                   <Button
//                     text="Continue"
//                     ariaLabel="Continue"
//                     primary
//                     onClick={() => router.push("/onboarding/sign-in")}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </Modal>
//     </NoSSR>
//   );
// };

// export default JoinUsPage;
