'use client';

import Link from 'next/link';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Racing_Sans_One } from 'next/font/google';
import { EyeClosed as EyeClosedIcon, Eye as EyeOpenIcon, LoaderCircle, ArrowLeft } from 'lucide-react';

import { BGAnimation } from '@/components';
import Form from '@/ui/forms';
import TextInput from '@/ui/inputs';
import Button from '@/ui/button';
import { useAuth } from '@/hooks/auth';
import { ApiError } from "@/lib/errors";

const racingsSans = Racing_Sans_One({
  variable: '--font-racings-sans',
  weight: '400',
  subsets: ['latin'],
});

const formSchema = z.object({
  email: z.email({ message: 'Enter a valid email address' }),
  password: z.string().min(5, { message: 'Password must contain at least 5 characters' }),
});

type UserFormValues = z.infer<typeof formSchema>;

export default function SignIn() {
  const router = useRouter();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { formState: { errors, isSubmitting } } = form;

  async function onSubmit(data: UserFormValues): Promise<void> {
    try {
      await login(data);

      router.replace('/');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.';

      form.setError('root', {
        type: 'server',
        message,
      });
    }
  }

  return (
    <div className='relative flex h-screen w-full items-center justify-between'>
      <div className='absolute left-0 top-0 z-[-1]'>
        <BGAnimation />
      </div>

      <div className='hidden h-full w-full md:w-[50%] lg:flex lg:flex-col lg:items-center lg:justify-center'>
        <div
          className={`${racingsSans.className} text-6xl capitalize text-white`}
        >
          Welcome Back
        </div>
      </div>

      <div className='flex h-full w-full items-center justify-center p-4 lg:w-[50%] lg:p-6'>
        <div className='container__form flex h-full w-full items-center justify-center rounded-xl bg-white p-6 text-slate-800'>
          <div className='max:h-120 max-w-104 lg:my-auto lg:w-104'>
            <Button
              href='/'
              variant='ghost'
              className='mb-4 gap-2 px-2'
            >
              <ArrowLeft size={18} />
              Back to whiteboard
            </Button>

            <div className='flex items-center lg:hidden'>
              <div
                className={`${racingsSans.className} text-[1.35rem] md:text-5xl`}
              >
                Welcome back
              </div>
            </div>

            <div className='py-4 text-xl lg:text-3xl'>
              Sign in
            </div>

            <div>
              Don&apos;t have an account?{' '}
              <Link
                href='/auth/sign-up'
                className='text-primary underline'
              >
                Create account
              </Link>
            </div>

            <Form
              onSubmit={onSubmit}
              methods={form}
            >
              <div className='my-4 flex flex-col items-center justify-center gap-2'>
                <TextInput
                  label='Email'
                  name='email'
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.75rem',
                    width: '100%',
                  }}
                />

                <div className='relative flex w-full'>
                  <TextInput
                    label='Password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    style={{
                      fontSize: '1rem',
                      lineHeight: '1.75rem',
                      width: '100%',
                    }}
                  />

                  <button
                    type='button'
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className='absolute right-3 top-1/4 cursor-pointer text-text-secondary'
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                  >
                    {showPassword ? (
                      <EyeOpenIcon />
                    ) : (
                      <EyeClosedIcon />
                    )}
                  </button>
                </div>
              </div>

              {errors.root && (
                <p className='mt-3 text-sm text-red-600'>
                  {errors.root.message}
                </p>
              )}

              <div className='my-9 flex flex-col items-start justify-center gap-2'>
                <Button
                  type='submit'
                  variant='contained'
                  disabled={isSubmitting}
                  className='w-full gap-2'
                >
                  {isSubmitting && (
                    <LoaderCircle
                      size={18}
                      className='animate-spin'
                      aria-hidden
                    />
                  )}

                  {isSubmitting
                    ? 'Signing in'
                    : 'Sign in'}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
