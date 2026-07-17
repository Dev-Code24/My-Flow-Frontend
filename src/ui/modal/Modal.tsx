'use client';

import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  width?: string;
  height?: string;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

export default function Modal({
   isOpen,
   onClose,
   children,
   header,
   footer,
   closable = true,
   closeOnBackdrop = true,
   closeOnEscape = true,
   width = '550px',
   height = 'auto',
   className = '',
   contentClassName = '',
   headerClassName = '',
   footerClassName = '',
}: ModalProps) {
   const modalRef = useRef<HTMLElement>(null);

   useEffect(() => {
      if (!isOpen) { return; }

      modalRef.current?.focus();

      function handleKeyDown(event: KeyboardEvent): void {
         if (
            event.key === 'Escape' &&
            closable &&
            closeOnEscape
         ) {
            event.preventDefault();
            onClose();
         }
      }

      document.addEventListener('keydown', handleKeyDown);

      return () => {
         document.removeEventListener('keydown', handleKeyDown);
      };
   }, [isOpen, closable, closeOnEscape, onClose]);

   if (!isOpen) { return null; }

   function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>): void {
      if (!closeOnBackdrop || !closable) { return; }

      if (event.target === event.currentTarget) {
         onClose();
      }
   }

   return (
      <div
         className='fixed inset-0 z-1000 flex items-center justify-center px-4 py-6'
         role='presentation'
         onMouseDown={handleBackdropClick}
      >
         <div className='absolute inset-0 bg-black/30 backdrop-blur-[2px]'/>

         <section
            ref={modalRef}
            role='dialog'
            aria-modal='true'
            tabIndex={-1}
            style={{ width, height }}
            className={`relative z-1001 max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl border border-[#E7E5EC] bg-white shadow-[0_24px_70px_-20px_rgba(0,0,0,0.45)] outline-none ${className}`}
            onMouseDown={(event) => event.stopPropagation()}
         >
         <div className='flex h-full w-full flex-col'>
            {(header || closable) && (
               <header className={`flex min-h-16 items-center justify-between border-b border-[#E7E5EC] px-5 py-4 ${headerClassName}`}>
               <div className='min-w-0 flex-1'>
                  {header}
               </div>

               {closable && (
                  <button
                     type='button'
                     onClick={onClose}
                     aria-label='Close dialog'
                     className='ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#6B6875] transition-colors hover:bg-[#F4F4F7] hover:text-[#2F2D38]'
                  >
                     <CloseIcon />
                  </button>
               )}
               </header>
            )}

            <main className={`flex-1 overflow-y-auto px-5 py-5 ${contentClassName}`}>
               {children}
            </main>

            {footer && (
               <footer
               className={`flex items-center justify-end gap-2 border-t border-[#E7E5EC] px-5 py-4 ${footerClassName}`}
               >
               {footer}
               </footer>
            )}
         </div>
         </section>
      </div>
   );
}

function CloseIcon() {
   return (
      <svg
         aria-hidden='true'
         viewBox='0 0 24 24'
         fill='none'
         className='h-5 w-5'
      >
         <path
         d='m6 6 12 12M18 6 6 18'
         stroke='currentColor'
         strokeWidth='1.8'
         strokeLinecap='round'
         />
      </svg>
   );
}