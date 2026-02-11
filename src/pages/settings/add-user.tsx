import React, { useState, useEffect, ChangeEvent } from 'react';
import Button from '@/components/button';
import Modal from '@/components/modal';
import FloatingLabelInput from '@/components/floating-input';
import TotpInput from '@/components/TotpInput';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  notifyError,
  notifySuccess,
} from '@/util/utils';
import Loader from '@/components/loader';
import { addUser } from '@/services/settings';
import { getRoles } from '@/services/settings';
import useAuthentication from '@/stores/useAuthentication';
import useClickEvent from '@/stores/useClickEvent';

interface AddUserProps {
  isModalOpen: boolean;
  closeModal: () => void;
  fetchUsers: () => void;
  isUpdateUser: boolean;
}

interface StateProps {
  isLoading: boolean;
  roles: any[];
  selectedRole: string;
}

interface AddUserPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  password_confirmation?: string;
  // phone: string;
  role?: string;
}

const AddUser: React.FC<AddUserProps> = ({
  isModalOpen,
  closeModal,
  fetchUsers,
  isUpdateUser,
}) => {
  const formik = useFormik({
    initialValues: {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      password_confirmation: '',
      // phone: '',
    },
    validationSchema: Yup.object().shape({
      firstname: Yup.string().required('First name is required!'),
      lastname: Yup.string().required('Last name is required!'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email address is required!'),

      password: isUpdateUser
        ? Yup.string().notRequired()
        : Yup.string()
          .required('Password is required!')
          .matches(
            /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
            'Password must have at least: 1 upper case, 1 digit, 1 special character and minimum eight characters'
          ),

      password_confirmation: isUpdateUser
        ? Yup.string().notRequired()
        : Yup.string()
          .oneOf([Yup.ref('password')], 'Passwords must match')
          .required('Confirm Password is required'),

      // phone: nigerianPhoneNumberSchema,
    }),

    validateOnMount: true,

    onSubmit: async () => {
      createAndUpdateUser();
    },
  });

  const { selectedItem } = useClickEvent();

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (isUpdateUser && selectedItem?.id) {
      formik.setValues({
        firstname: selectedItem.firstname,
        lastname: selectedItem.lastname,
        email: selectedItem.email,
        password: selectedItem.password,
        password_confirmation: selectedItem.password_confirmation,
        // phone: selectedItem.phone,
      });
    } else {
      resetState();
    }
  }, [isUpdateUser, selectedItem?.id]);

  const fetchRoles = async () => {
    try {
      const roles = await getRoles();
      setState({ ...state, roles, isLoading: false });
    } catch (error) { }
  };

  const { totp_enabled } = useAuthentication();
  const [otp, setOtp] = useState('');
  const [state, setState] = useState<StateProps>({
    isLoading: false,
    roles: [],
    selectedRole: '',
  });

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setState({ ...state, selectedRole: value });
  };

  const createAndUpdateUser = async () => {
    const { firstname, lastname, email, password } = formik.values;
    const payload: AddUserPayload = {
      firstname,
      lastname,
      email,
      password,
    };
    if (state.selectedRole) {
      payload['role'] = state.selectedRole;
    }

    let updateStatus;
    let id;

    if (isUpdateUser) {
      updateStatus = true;
      id = selectedItem?.id;
    } else {
      updateStatus = false;
      id = '';
    }
    try {
      setState({ ...state, isLoading: true });
      await addUser(payload, id, updateStatus);
      // @ts-ignore
      notifySuccess(
        `User ${isUpdateUser ? 'updated' : 'created'} successfully`
      );
      closeModal();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setState({ ...state, isLoading: false });
      closeModal();
      fetchUsers();
      resetState();
    }
  };

  const resetState = () => {
    setState({
      ...state,
      isLoading: false,
      selectedRole: '',
    });
    setOtp('');
    formik.setValues({
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      password_confirmation: '',
      // phone: '',
    });
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className='mt-5'>
        <form onSubmit={formik.handleSubmit}>
          <div className='grid grid-cols-2 gap-3'>
            <FloatingLabelInput
              label='First name'
              id='firstname'
              type='text'
              htmlFor='firstname'
              formik={formik}
              {...formik.getFieldProps('firstname')}
            />
            <FloatingLabelInput
              label='Last name'
              id='lastname'
              type='text'
              htmlFor='lastname'
              formik={formik}
              {...formik.getFieldProps('lastname')}
            />
          </div>

          {/* <FloatingLabelInput
            label='Phone Number'
            id='phone'
            type='number'
            htmlFor='phone'
            formik={formik}
            maxLength={11}
            {...formik.getFieldProps('phone')}
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

          {!isUpdateUser && (
            <>
              <FloatingLabelInput
                label='Password'
                id='password'
                type='password'
                htmlFor='password'
                formik={formik}
                {...formik.getFieldProps('password')}
              />

              <FloatingLabelInput
                label='Password Confirmation'
                id='password_confirmation'
                type='password'
                htmlFor='password_confirmation'
                formik={formik}
                {...formik.getFieldProps('password_confirmation')}
              />
            </>
          )}

          <select
            className='h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5'
            onChange={handleChange}
          >
            <option value='Select Role'>--Select Role--</option>

            {state.roles?.map((option: any) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <Button
            className='openSansLight text-white mt-2 text-xs p-2 rounded'
            text={state.isLoading ? <Loader /> : 'Submit'}
            ariaLabel='Submit'
            disabled={!formik.isValid || state.isLoading || (totp_enabled && !otp.trim())}
            primary
          />
        </form>
      </div>
    </Modal>
  );
};

export default AddUser;
