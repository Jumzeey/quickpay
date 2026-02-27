import Button from '@/components/button';
import FormInput from '@/components/FormInput';
import FormSelect from '@/components/FormSelect';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import { RoleListItem } from '@/components/settings/ManageUserTab/create-update-roles-modal';
import { useFormValidation } from '@/hooks/useFormValidation';
import { addUser, getRoles } from '@/services/settings';
import useAuthentication from '@/stores/useAuthentication';
import { notifyError, notifySuccess, passwordValidation } from '@/util/utils';
import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import PinInput from 'react-pin-input';
import * as Yup from 'yup';

const TOTP_LENGTH = 6;
const RECOVERY_CODE_LENGTH = 10;

interface CreateUpdateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isUpdateUser?: boolean;
  userData?: any;
}

const validationSchema = (isUpdateUser: boolean) => Yup.object({
  firstname: Yup.string().required('First name is required!'),
  lastname: Yup.string().required('Last name is required!'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email address is required!'),
  password: isUpdateUser
    ? Yup.string().notRequired()
    : passwordValidation,
  role: Yup.string().notRequired(),
});

interface CreateUpdateUserFormValues {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
}

const CreateUpdateUserModal: React.FC<CreateUpdateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isUpdateUser = false,
  userData = null,
}) => {
  const { totp_enabled } = useAuthentication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [otpValue, setOtpValue] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCodeValue, setRecoveryCodeValue] = useState('');
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useFormValidation<CreateUpdateUserFormValues>(
    validationSchema(isUpdateUser), {
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      role: '',
    },
    mode: 'onChange'
  });

  // const { data: roles, loading } = useAsyncFetch({
  //   key: 'get-roles',
  //   fn: async () => {
  //     const response = await getRoles();
  //     return response?.data || [];
  //   }
  // });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    if (roles.length) return;

    try {
      setIsLoading("get-roles");
      const roles = await getRoles();
      setRoles(roles);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(null);
    }
  };

  const buildPayload = (values: CreateUpdateUserFormValues) => {
    const { firstname, lastname, email, password, role } = values;
    const payload: any = { firstname, lastname, email, role };
    if (!isUpdateUser) payload.password = password;
    return payload;
  };

  const getOtpCode = (): string =>
    useRecoveryCode ? recoveryCodeValue.trim().toUpperCase() : otpValue;

  const submitWithOtp = async () => {
    if (!pendingPayload || !getOtpCode()) return;
    setIsOtpSubmitting(true);
    try {
      await addUser(
        { ...pendingPayload, otp: getOtpCode() },
        isUpdateUser ? userData?.id || '' : '',
        isUpdateUser
      );
      notifySuccess(`User ${isUpdateUser ? 'updated' : 'created'} successfully`);
      setOtpModalOpen(false);
      setPendingPayload(null);
      onClose();
      onSuccess();
    } catch (error: any) {
      notifyError(error?.response?.data?.message ?? error?.message ?? `Failed to ${isUpdateUser ? 'update' : 'create'} user`);
    } finally {
      setIsOtpSubmitting(false);
    }
  };

  const closeOtpModal = () => {
    setOtpModalOpen(false);
    setPendingPayload(null);
    setOtpValue('');
    setRecoveryCodeValue('');
    setUseRecoveryCode(false);
  };

  const onSubmit = async (values: CreateUpdateUserFormValues) => {
    const payload = buildPayload(values);
    if (totp_enabled) {
      setPendingPayload(payload);
      setOtpValue('');
      setRecoveryCodeValue('');
      setUseRecoveryCode(false);
      setOtpModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await addUser(
        payload,
        isUpdateUser ? userData?.id || '' : '',
        isUpdateUser
      );
      notifySuccess(`User ${isUpdateUser ? 'updated' : 'created'} successfully`);
      onClose();
      onSuccess();
    } catch (error: any) {
      notifyError(error?.response?.data?.message ?? error?.message ?? `Failed to ${isUpdateUser ? 'update' : 'create'} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen && isUpdateUser && userData) {
      reset({
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        email: userData.email || '',
        role: String(roles.find((role) => role.name === userData.role)?.id || '')
      });
    } else if (isOpen && !isUpdateUser) {
      reset({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        role: '',
      });
    }
  }, [isOpen, isUpdateUser, userData, roles, reset]);

  const roleOptions = roles?.map((role) => ({
    value: String(role.id),
    label: role.name
  })) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isUpdateUser ? 'Update' : 'Add New'} User`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className='grid grid-cols-2 gap-3'>
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
              autoComplete="off"
              {...field}
            />
          )}
        />

        {/* Only show password field for new users */}
        {!isUpdateUser && (
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <FormInput
                label="Set password"
                id="password"
                type="password"
                htmlFor="password"
                error={errors.password?.message}
                touched={!!errors.password}
                autoComplete="off"
                {...field}
              />
            )}
          />
        )}

        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <FormSelect
              label="Set role"
              id="role"
              htmlFor="role"
              placeholder="Select Role"
              options={roleOptions}
              error={errors.role?.message}
              touched={!!errors.role}
              {...field}
            />
          )}
        />

        <div className="w-[113px]">
          <Button
            className="font-medium text-white mt-5 text-xs p-2 rounded w-full"
            text={isSubmitting ? <Loader /> : isUpdateUser ? "Update" : "Create"}
            ariaLabel={`${isUpdateUser ? 'Update' : 'Create'} User`}
            disabled={isSubmitting || (!isUpdateUser && !watch('role'))}
            primary
            type="submit"
          />
        </div>
      </form>

      {totp_enabled && (
        <Modal
          isOpen={otpModalOpen}
          title={useRecoveryCode ? "Enter recovery code" : "Enter authenticator code"}
          onClose={closeOtpModal}
        >
          <div className="space-y-4 px-4 pb-4">
            <p className="text-sm text-[#7F7F7F]">
              {useRecoveryCode
                ? "Enter one of the 10-character recovery codes you saved when you set up 2FA."
                : "Enter the 6-digit code from your authenticator app to confirm."}
            </p>
            <div className="mb-2">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode((prev: boolean) => !prev);
                  setOtpValue('');
                  setRecoveryCodeValue('');
                }}
                className="text-sm font-medium text-primary hover:text-blue-700"
              >
                {useRecoveryCode ? "Use authenticator code" : "Use a backup code"}
              </button>
            </div>
            {useRecoveryCode ? (
              <div className="flex flex-col">
                <label htmlFor="add-user-recovery-code" className="text-sm font-medium text-[#111827] mb-1">
                  Recovery code
                </label>
                <input
                  id="add-user-recovery-code"
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  maxLength={RECOVERY_CODE_LENGTH}
                  value={recoveryCodeValue}
                  onChange={(e) =>
                    setRecoveryCodeValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  }
                  onKeyDown={(e) => e.key === 'Enter' && submitWithOtp()}
                  placeholder="e.g. WO1EBITAQJ"
                  className="w-full h-11 px-3 border border-[#C4C4C43D] rounded-lg text-center font-mono text-base tracking-widest text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            ) : (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-[#111827] mb-2 block">Authenticator code</label>
                <div className="flex justify-center">
                  <PinInput
                    length={TOTP_LENGTH}
                    initialValue=""
                    type="numeric"
                    inputMode="number"
                    focus
                    onChange={(value) => setOtpValue(value)}
                    onComplete={(value) => setOtpValue(value)}
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}
                    inputStyle={{
                      width: '44px',
                      height: '50px',
                      border: '1.5px solid #C4C4C43D',
                      borderRadius: '5px',
                      fontSize: '16px',
                      color: '#111827',
                    }}
                    inputFocusStyle={{ border: '2px solid #2563EB', outline: 'none' }}
                    autoSelect
                    regexCriteria={/^[0-9]*$/}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                text="Cancel"
                ariaLabel="Cancel"
                onClick={closeOtpModal}
                className="min-w-[100px]"
                plain
              />
              <Button
                type="button"
                text={isOtpSubmitting ? <Loader /> : (isUpdateUser ? 'Update' : 'Create')}
                ariaLabel={isUpdateUser ? 'Update user' : 'Create user'}
                primary
                disabled={isOtpSubmitting || !getOtpCode()}
                onClick={submitWithOtp}
                className="min-w-[100px]"
              />
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default CreateUpdateUserModal;