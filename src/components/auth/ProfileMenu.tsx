'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, LogOut } from 'lucide-react';

import { AuthUser } from '@/lib/interfaces';
import { getAvatarBackgroundColor, getAvatarText } from '@/lib/utils';
import { KeyboardKeys } from "@/constants";
import Button from '@/ui/button';

interface ProfileMenuProps {
  user: AuthUser;
  onLogout: () => Promise<void>;
}

export default function ProfileMenu({
  user,
  onLogout,
}: ProfileMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const avatarText = getAvatarText(user.name);

  const avatarBackgroundColor =  getAvatarBackgroundColor(user.name);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleMouseDown(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === KeyboardKeys.ESCAPE) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleLogout(): Promise<void> {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await onLogout();
      setIsOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className='relative'
    >
      <button
        type='button'
        aria-label='Open profile menu'
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
        className='flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105'
        style={{
          backgroundColor: avatarBackgroundColor,
        }}
      >
        {avatarText}
      </button>

      {isOpen && (
        <div className='absolute right-0 top-12 z-50 min-w-56 rounded-xl border border-border bg-white p-3 shadow-lg'>
          <div className='border-b border-border px-2 pb-3'>
            <p className='font-medium text-text-primary'>
              {user.name}
            </p>

            <p className='mt-1 text-sm text-text-secondary'>
              {user.email}
            </p>
          </div>

          <div className='pt-3'>
            <Button
              type='button'
              variant='ghost'
              disabled={isLoggingOut}
              onClick={handleLogout}
              className='w-full justify-start gap-2'
            >
              {isLoggingOut ? (
                <LoaderCircle
                  size={17}
                  className='animate-spin'
                  aria-hidden
                />
              ) : (
                <LogOut
                  size={17}
                  aria-hidden
                />
              )}

              {isLoggingOut ? 'Logging out' : 'Logout'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}