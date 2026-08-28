import Link from 'next/link';
import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'outlined' | 'ghost' | 'contained';
  children: ReactNode;
  href?: string;
}

export default function Button({
  variant,
  children,
  className,
  href,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50';

  const variantStyles = {
    outlined: 'border border-primary bg-white text-primary hover:bg-primary/8',
    ghost: 'bg-transparent text-text-primary hover:bg-slate-100',
    contained: 'bg-primary text-white hover:bg-primary/90',
  };

  const classes = `${baseStyles} ${variantStyles[variant]} ${className || ''}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}