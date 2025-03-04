import React, { useState } from 'react';
import FloatingLabelInput from '@/components/floating-input';
import Image from 'next/image';
import Sidebar from '@/components/onboarding/sidebar';
import Button from '@/components/button';
import Link from 'next/link';
import useAuthentication from '@/stores/useAuthentication';
import { useRouter } from 'next/router';
import { notifyError, notifySuccess } from '@/util/utils';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Loader from '@/components/loader';
import WebPageTitle from '@/components/WebPageTitle';
import { motion } from 'framer-motion';
import { MultiStepAnimation } from '@/animations';

const ForgotPassword: React.FC = () => {
  const router = useRouter();
  const navigateBack = () => {
    router.back();
  };

  const { forgotPassword } = useAuthentication();
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object().shape({
      email: Yup.string()
        .email('Enter a valid email')
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          'Email must have a valid provider'
        )
        .required('Email address is required!'),
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
    };
    try {
      const response = await forgotPassword(payload);
      notifySuccess(response.message);
      setIsLoading(false);
      localStorage.setItem('user-email', values.email);
      router.push({
        pathname: '/onboarding/otp',
        query: { source: 'forgot-password' },
      });
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full min-h-screen flex justify-center text-white bg-ramp'>
      <WebPageTitle title='Forgot Password | Ramp Merchant Portal' />
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
          className='mt-52'
          variants={MultiStepAnimation}
          initial='hidden'
          animate='visible'
        >
          <div>
            <h1 className='font-semibold text-2xl'>
              Relax, we have you covered.
            </h1>
            <p className='font-light mt-1 mb-5 text-sm'>
              Provide your email address to reset your password.
            </p>
            <form onSubmit={formik.handleSubmit} className='mt-10'>
              <FloatingLabelInput
                label='Email'
                id='email'
                type='email'
                htmlFor='email'
                formik={formik}
                {...formik.getFieldProps('email')}
              />
              <div className='flex justify-center'>
                <Button
                  text={isLoading ? <Loader /> : 'Send Password Reset Email'}
                  ariaLabel='Reset Password Button'
                  disabled={isLoading}
                  primary
                />
              </div>
              <div className='mt-10'>
                <p className='text-center text-sm'>
                  Remember account password?&nbsp;
                  <Link href='/onboarding/sign-in'>
                    <span className='text-white text-sm font-medium underline-animation'>
                      Sign In
                    </span>
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
