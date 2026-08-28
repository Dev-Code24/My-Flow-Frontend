'use client';

import { useAuth } from '@/hooks/auth';

import Button from '@/ui/button';
import ProfileMenu from './ProfileMenu';

export default function AuthAction() {
  const {user, isInitializing, logout } = useAuth();

  if (isInitializing) {
    return null;
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