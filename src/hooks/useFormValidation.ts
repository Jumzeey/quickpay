import { useForm, UseFormProps } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

export function useFormValidation<T extends Record<string, any>>(
  schema: Yup.ObjectSchema<any>,
  options?: UseFormProps<T>
) {
  return useForm<T>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    ...options,
  });
}

// Usage example:
// const form = useFormValidation(validationSchema, { defaultValues: {...} });