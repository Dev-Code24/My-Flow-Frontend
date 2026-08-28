import { FormProvider, UseFormReturn, FieldValues } from 'react-hook-form';

interface FormProps<T extends FieldValues> {
  methods: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  className?: string;
  children: React.ReactNode;
}

const Form = <T extends FieldValues>({ methods, onSubmit, className, children }: FormProps<T>) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
        {children}
      </form>
    </FormProvider>
  );
};

export default Form;