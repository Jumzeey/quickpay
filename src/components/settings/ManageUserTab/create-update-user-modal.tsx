import Button from '@/components/button';
import FormInput from '@/components/FormInput';
import FormSelect from '@/components/FormSelect';
import Loader from '@/components/loader';
import Modal from '@/components/modal';
import { RoleListItem } from '@/components/settings/ManageUserTab/create-update-roles-modal';
import { useFormValidation } from '@/hooks/useFormValidation';
import { addUser, getRoles } from '@/services/settings';
import { notifyError, notifySuccess, passwordValidation } from '@/util/utils';
import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import * as Yup from 'yup';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleListItem[]>([]);

  const {
    control,
    handleSubmit,
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

  const onSubmit = async (values: CreateUpdateUserFormValues) => {
    setIsSubmitting(true);
    try {
      const { firstname, lastname, email, password, role } = values;

      const payload: any = {
        firstname,
        lastname,
        email,
        role
      };

      // Only include password for new users
      if (!isUpdateUser) {
        payload.password = password;
      }

      await addUser(
        payload,
        isUpdateUser ? userData?.id || '' : '',
        isUpdateUser
      );

      notifySuccess(`User ${isUpdateUser ? 'updated' : 'created'} successfully`);
      onClose();
      onSuccess();
    } catch (error: any) {
      notifyError(error.message || `Failed to ${isUpdateUser ? 'update' : 'create'} user`);
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
            disabled={isSubmitting}
            primary
            type="submit"
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateUpdateUserModal;