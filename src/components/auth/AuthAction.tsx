'use client';

import { useAuth } from '@/hooks/auth';

import Button from '@/ui/button';
import ProfileMenu from './ProfileMenu';
import { LoaderCircle } from "lucide-react";

export default function AuthAction() {
  const { user, isInitializing, logout } = useAuth();

  if (isInitializing) {
    return (
      <button
        type='button'
        aria-label='Open profile menu'
        className='flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white bg-gray-200 shadow-sm transition-transform hover:scale-105'
      >
        <LoaderCircle className='animate-spin' />
      </button>
    );
  }

  if (!user) {
    return (
      <Button
        href='/auth/sign-in'
        variant='outlined'
        className='h-10'
      >
        Login
      </Button>
    );
  }

  return (
    <ProfileMenu
      user={user}
      onLogout={logout}
    />
  );
}