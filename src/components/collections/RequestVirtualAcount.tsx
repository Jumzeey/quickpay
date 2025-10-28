import Button from '@/components/button';
import FormInput from '@/components/FormInput';
import FormSelect from '@/components/FormSelect';
import Modal from '@/components/modal';
import TabButton from '@/components/TabButton';
import PinInput from 'react-pin-input';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useApiResponse } from '@/hooks/useApiResponse';
import {
  createVirtualAccount,
  verifyVirtualAccountOtp,
} from '@/services/collections';
import { notifyInfo, uuid } from '@/util/utils';
import Image from 'next/image';
import React, { ChangeEvent, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import * as Yup from 'yup';
import Loader from '../loader';

export const VIRTUAL_ACCOUNT_TYPES: { id: number; name: string }[] = [
  { id: 1, name: 'Onetime' },
  { id: 2, name: 'Permanent' },
];

export const VIRTUAL_ACCOUNT_CURRENCIES: {
  value: string;
  label: string;
  disabled?: boolean;
}[] = [
  { value: 'NGN', label: '₦ Nigerian Naira (NGN)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)', disabled: true },
];

interface AddAccountProps {
  isModalOpen: boolean;
  closeModal: () => void;
  fetchVirtualAccounts: () => void;
  onUSDRouting?: () => void;
}

interface StateProps {
  accountType: 'Individual' | 'Corporate';
  virtualType: string;
  currency: string;
  isLoading: boolean;
  currentStep: number;
}

export type VirtualAccountFormValues = {
  // common
  account_name?: string;
  customer_email?: string;
  provider?: string;

  // Personal / Individual account fields
  first_name?: string;
  last_name?: string;
  other_name?: string;
  date_of_birth?: string;

  // Corporate account fields
  business_name?: string;
  rc_number?: string;

  // bvn and nin
  bvn?: string;
  nin?: string;
};


const RequestVirtualAccount: React.FC<AddAccountProps> = ({
  isModalOpen,
  closeModal,
  fetchVirtualAccounts,
  onUSDRouting,
}) => {
  const { handleError, handleSuccess } = useApiResponse();
  const initialValues: VirtualAccountFormValues = {
    account_name: '',
    customer_email: '',
    provider: '',
    first_name: '',
    last_name: '',
    other_name: '',
    bvn: '',
    nin: '',
    date_of_birth: '',
    business_name: '',
    rc_number: '',
  };

  const [state, setState] = useState<StateProps>({
    accountType: 'Individual',
    virtualType: '',
    currency: '',
    isLoading: false,
    currentStep: 0,
  });

  const [otp, setOtp] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const validationSchema = useMemo(() => {
    const baseSchema: Record<string, any> = {
      bvn: Yup.string()
        .required('BVN is required')
        .min(11, 'BVN should contain 11 digits')
        .max(11, 'BVN should contain 11 digits'),
      account_name: Yup.string().required('Account name is required'),
      customer_email: Yup.string()
        .email('Invalid email format')
        .required('Customer email is required'),
      // provider only required when currency is NGN
      provider:
        state.currency === 'NGN'
          ? Yup.string().required('Provider is required')
          : Yup.string().notRequired(),
    };

    if (state.accountType === 'Individual') {
      return Yup.object().shape({
        ...baseSchema,
        first_name: Yup.string().required('First name is required'),
        last_name: Yup.string().required('Last name is required'),
        other_name: Yup.string().required('Other name is required'),
        date_of_birth: Yup.string().required('Date of birth is required'),
        nin: Yup.string()
          .required('NIN is required')
          .min(11, 'NIN should contain 11 digits')
          .max(11, 'NIN should contain 11 digits'),
      });
    } else if (state.accountType === 'Corporate') {
      return Yup.object().shape({
        ...baseSchema,
        business_name: Yup.string().required('Business name is required'),
        rc_number: Yup.string().required('RC Number is required'),
        nin: Yup.string()
          .required('NIN is required')
          .min(11, 'NIN should contain 11 digits')
          .max(11, 'NIN should contain 11 digits'),
      });
    }

    return Yup.object().shape(baseSchema);
  }, [state.accountType, state.currency]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useFormValidation<VirtualAccountFormValues>(
    validationSchema as Yup.ObjectSchema<any>,
    {
      defaultValues: initialValues,
      mode: 'onChange',
    }
  );

  // const handleCurrencySelect = (currency: string) => {
  //   setState(prev => ({
  //     ...prev,
  //     currency,
  //     currentStep: 2,
  //   }));
  // };

  const handleCurrencySelect = (currency: string) => {
    if (currency === 'USD') {
      closeModal();
      onUSDRouting?.();
      return;
    }

    setState(prev => ({
      ...prev,
      currency,
      currentStep: 2,
    }));
  };
  
  const handleOptionClick = (option: (typeof VIRTUAL_ACCOUNT_TYPES)[0]) => {
    if (option.name === 'Onetime') {
      notifyInfo('Onetime virtual accounts are not supported at the moment.');
      return;
    }
    setState(prev => ({
      ...prev,
      virtualType: option.name,
      currentStep: 1,
      isLoading: false,
    }));
    reset();
  };

  const resetAndClose = () => {
    setState(prev => ({
      ...prev,
      virtualType: 'Permanent',
      currency: '',
      accountType: 'Individual',
      isLoading: false,
      currentStep: prev.currentStep === 0 ? 0 : prev.currentStep - 1,
    }));

    setIsOtpStep(false);
    setOtp('');

    reset();

    if (state.currentStep === 0 || isOtpStep) {
      closeModal();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value, name } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const requestVirtualAccount = async (values: VirtualAccountFormValues) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const payload: any = {
        type: state.accountType.toLowerCase(),
        virtual_account_type: 'Permanent',
        currency: state.currency,
        // provider only included for NGN (and only present in form when NGN)
        ...(state.currency === 'NGN' && { provider: values.provider }),
        bvn: values.bvn,
        account_name: values.account_name,
        customer_email: values.customer_email,
        reference: uuid(), // auto-generated 36-character UUID v4
      };

      if (state.accountType === 'Individual') {
        Object.assign(payload, {
          first_name: values.first_name,
          last_name: values.last_name,
          other_name: values.other_name,
          date_of_birth: values.date_of_birth,
          nin: values.nin,
        });
      } else {
        Object.assign(payload, {
          business_name: values.business_name,
          rc_number: values.rc_number,
          nin: values.nin,
        });
      }

      const response = await createVirtualAccount(payload);
      // @ts-ignore
      if (values.provider === 'Wema' && response?.data?.message) {
        handleSuccess(response, 'OTP sent to your phone');
        setIsOtpStep(true); // move to OTP step
      } else {
        handleSuccess(response, 'Virtual account created successfully');
        resetAndClose();
        closeModal();
        await fetchVirtualAccounts();
      }
    } catch (error: any) {
      handleError(error, 'Failed to create virtual account');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleOtpSubmit = async (code?: string) => {
    const otpCode = code || otp;
    if (!otpCode || otpCode.length < 4) {
      handleError({ message: 'Please enter a valid OTP' }, 'Please enter a valid OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const payload = {
        otp: otpCode,
        customer_email: watch('customer_email') ?? '', // pull from previous form
      };
      const response = await verifyVirtualAccountOtp(payload);
      handleSuccess(response, 'OTP verified successfully');
      setIsOtpStep(false);
      resetAndClose();
      closeModal();
      await fetchVirtualAccounts();
    } catch (error: any) {
      handleError(error, 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (state.currentStep) {
      case 0:
        return 'Select Virtual Account Currency';
      case 1:
        return 'Select Virtual Account Type';
      case 2:
        return 'Request Virtual Account';
      default:
        return 'Request Virtual Account';
    }
  };

  return (
    <Modal
      title={isOtpStep ? 'Verify OTP' : getModalTitle()}
      isOpen={isModalOpen}
      onClose={resetAndClose}
    >
      <div className='mt-5'>
        {/* OTP STEP */}
        {isOtpStep ? (
          <div className='flex flex-col items-center justify-center py-6'>
            <p className='text-sm text-gray-600 mb-4'>
              An OTP was sent to your registered phone number for verification.
            </p>

            <PinInput
              length={6}
              initialValue=''
              type='numeric'
              inputMode='number'
              onChange={value => setOtp(value)}
              onComplete={value => handleOtpSubmit(value)}
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
              inputStyle={{
                width: '45px',
                height: '50px',
                border: '1.5px solid #C4C4C43D',
                borderRadius: '5px',
                fontSize: '16px',
                color: '#111827',
              }}
              inputFocusStyle={{
                border: '2px solid #2563EB',
                outline: 'none',
              }}
              autoSelect
              regexCriteria={/^[0-9]*$/}
            />

            <Button
              onClick={() => handleOtpSubmit()}
              className='mt-6 px-6 py-2 text-sm rounded'
              text={otpLoading ? 'Verifying...' : 'Verify OTP'}
              ariaLabel='Verify OTP'
              disabled={otpLoading}
              primary
            />
          </div>
        ) : (
          <>
            {state.currentStep === 0 && (
              <ul className='space-y-2'>
                {VIRTUAL_ACCOUNT_TYPES.map(option => (
                  <li key={option.id}>
                    <button
                      type='button'
                      className={`w-full flex items-center justify-between font-semibold text-sm text-black dark:text-white py-5 ${
                        option.id !== VIRTUAL_ACCOUNT_TYPES.length
                          ? 'border-b border-[#C4C4C452]'
                          : ''
                      }`}
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.name}
                      <Image
                        src='/images/arrow-right.svg'
                        alt='Arrow Image'
                        width={6}
                        height={8}
                        priority
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {state.currentStep === 1 && (
              <ul className='space-y-2'>
                {VIRTUAL_ACCOUNT_CURRENCIES.map((currency, index) => (
                  <li key={currency.value}>
                    <button
                      type='button'
                      disabled={!!currency.disabled}
                      className={`w-full flex items-center justify-between font-semibold text-sm 
                      ${
                        currency.disabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-black dark:text-white cursor-pointer'
                      }
                      py-5 ${
                        index !== VIRTUAL_ACCOUNT_CURRENCIES.length - 1
                          ? 'border-b border-[#C4C4C452]'
                          : ''
                      }`}
                      onClick={() =>
                        !currency.disabled &&
                        handleCurrencySelect(currency.value)
                      }
                    >
                      <div className='flex items-center'>
                        <span className='text-lg mr-2'>
                          {currency.label.split(' ')[0]}
                        </span>
                        <span>
                          {currency.label.split(' ').slice(1).join(' ')}
                        </span>
                      </div>
                      {!currency.disabled ? (
                        <Image
                          src='/images/arrow-right.svg'
                          alt='Arrow Image'
                          width={6}
                          height={8}
                          priority
                        />
                      ) : (
                        <span className='text-xs text-gray-400'>
                          (Coming soon)
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {state.currentStep === 2 && (
              <form onSubmit={handleSubmit(requestVirtualAccount)}>
                {state.virtualType && (
                  <>
                    {state.virtualType === 'Onetime' ? (
                      <div className='space-y-6'>
                      </div>
                    ) : (
                      <>
                        <TabButton
                          tabs={[
                            {
                              title: 'Individual Account',
                              value: 'Individual',
                              isActive: state.accountType === 'Individual',
                            },
                            {
                              title: 'Corporate Account',
                              value: 'Corporate',
                              isActive: state.accountType === 'Corporate',
                            },
                          ]}
                          onTabClick={value => {
                            setState(prev => ({
                              ...prev,
                              accountType: value as 'Individual' | 'Corporate',
                            }));
                          }}
                        />

                        <div className='flex items-center text-sm mt-6'>
                          <span className='text-gray-500 mr-2'>Currency:</span>
                          <span className='font-medium'>{state.currency}</span>
                          <span className='mx-4'>•</span>
                          <span className='text-gray-500 mr-2'>Type:</span>
                          <span className='font-medium'>
                            {state.virtualType}
                          </span>
                        </div>

                        <div className='mt-6'>
                          <div className='space-y-6'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                              <Controller
                                name='account_name'
                                control={control}
                                render={({ field }) => (
                                  <FormInput
                                    label='Account name'
                                    id='account_name'
                                    type='text'
                                    htmlFor='account_name'
                                    maxLength={100}
                                    error={errors.account_name?.message}
                                    touched={!!errors.account_name}
                                    {...field}
                                  />
                                )}
                              />

                              <Controller
                                name='customer_email'
                                control={control}
                                render={({ field }) => (
                                  <FormInput
                                    label='Customer email'
                                    id='customer_email'
                                    type='email'
                                    htmlFor='customer_email'
                                    error={errors.customer_email?.message}
                                    touched={!!errors.customer_email}
                                    {...field}
                                  />
                                )}
                              />
                            </div>

                            {state.currency === 'NGN' && (
                              <div>
                                <Controller
                                  name='provider'
                                  control={control}
                                  render={({ field }) => (
                                    <FormSelect
                                      label='Provider'
                                      id='provider'
                                      htmlFor='provider'
                                      error={errors.provider?.message}
                                      touched={!!errors.provider}
                                      options={[
                                        { value: 'Wema', label: 'Wema' },
                                        { value: 'monnify', label: 'Monnify' },
                                      ]}
                                      {...field}
                                    />
                                  )}
                                />
                              </div>
                            )}

                            {state.accountType === 'Individual' ? (
                              <div className='space-y-6'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <Controller
                                    name='first_name'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='First name'
                                        id='first_name'
                                        type='text'
                                        htmlFor='first_name'
                                        maxLength={50}
                                        error={errors.first_name?.message}
                                        touched={!!errors.first_name}
                                        {...field}
                                      />
                                    )}
                                  />

                                  <Controller
                                    name='last_name'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='Last name'
                                        id='last_name'
                                        type='text'
                                        htmlFor='last_name'
                                        maxLength={50}
                                        error={errors.last_name?.message}
                                        touched={!!errors.last_name}
                                        {...field}
                                      />
                                    )}
                                  />
                                </div>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <Controller
                                    name='other_name'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='Other name'
                                        id='other_name'
                                        type='text'
                                        htmlFor='other_name'
                                        maxLength={50}
                                        error={errors.other_name?.message}
                                        touched={!!errors.other_name}
                                        {...field}
                                      />
                                    )}
                                  />

                                  <Controller
                                    name='date_of_birth'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='Date of birth'
                                        id='date_of_birth'
                                        type='date'
                                        htmlFor='date_of_birth'
                                        error={errors.date_of_birth?.message}
                                        touched={!!errors.date_of_birth}
                                        max={
                                          new Date(
                                            new Date().setFullYear(
                                              new Date().getFullYear() - 16
                                            )
                                          )
                                            .toISOString()
                                            .split('T')[0]
                                        }
                                        {...field}
                                      />
                                    )}
                                  />
                                </div>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <Controller
                                    name='bvn'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='BVN'
                                        id='bvn'
                                        type='text'
                                        htmlFor='bvn'
                                        maxLength={11}
                                        numberOnly
                                        error={errors.bvn?.message}
                                        touched={!!errors.bvn}
                                        {...field}
                                      />
                                    )}
                                  />

                                  <Controller
                                    name='nin'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='NIN'
                                        id='nin'
                                        type='text'
                                        htmlFor='nin'
                                        maxLength={11}
                                        numberOnly
                                        error={errors.nin?.message}
                                        touched={!!errors.nin}
                                        {...field}
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className='space-y-6'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <Controller
                                    name='business_name'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='Business Name'
                                        id='business_name'
                                        type='text'
                                        htmlFor='business_name'
                                        error={errors.business_name?.message}
                                        touched={!!errors.business_name}
                                        {...field}
                                      />
                                    )}
                                  />

                                  <Controller
                                    name='rc_number'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='RC Number'
                                        id='rc_number'
                                        type='text'
                                        htmlFor='rc_number'
                                        error={errors.rc_number?.message}
                                        touched={!!errors.rc_number}
                                        {...field}
                                      />
                                    )}
                                  />
                                </div>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <Controller
                                    name='bvn'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='BVN'
                                        id='bvn'
                                        type='text'
                                        htmlFor='bvn'
                                        maxLength={11}
                                        numberOnly
                                        error={errors.bvn?.message}
                                        touched={!!errors.bvn}
                                        {...field}
                                      />
                                    )}
                                  />

                                  <Controller
                                    name='nin'
                                    control={control}
                                    render={({ field }) => (
                                      <FormInput
                                        label='NIN'
                                        id='nin'
                                        type='text'
                                        htmlFor='nin'
                                        maxLength={11}
                                        numberOnly
                                        error={errors.nin?.message}
                                        touched={!!errors.nin}
                                        {...field}
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className='w-40'>
                  <Button
                    className='text-white mt-8 text-xs p-2 rounded'
                    text={state.isLoading ? <Loader /> : 'Request Account'}
                    ariaLabel='Submit'
                    disabled={state.isLoading}
                    primary
                    type='submit'
                  />
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default RequestVirtualAccount;
