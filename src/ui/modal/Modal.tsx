'use client';

import { X } from 'lucide-react';
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

      return () => { document.removeEventListener('keydown', handleKeyDown); };
   }, [isOpen, closable, closeOnEscape, onClose ]);

   if (!isOpen) { return null; }

   function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>): void {
      if (!closeOnBackdrop || !closable) { return; }

      if (event.target === event.currentTarget) {
         onClose();
      }
   }

   return (
      <div
         role='presentation'
         onMouseDown={handleBackdropClick}
         className='fixed inset-0 z-1000 flex items-center justify-center px-4 py-4'
      >
         <div className='absolute inset-0 bg-black/30 backdrop-blur-[2px]' />

         <section
            ref={modalRef}
            role='dialog'
            aria-modal='true'
            tabIndex={-1}
            style={{
               width,
               height,
            }}
            onMouseDown={(event) => event.stopPropagation()}
            className={`relative z-1001 max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl border border-[#E7E5EC] bg-white shadow-[0_24px_70px_-20px_rgba(0,0,0,0.45)] outline-none ${className}`}
         >
            <div className='flex h-full w-full flex-col'>
               {(header || closable) && (
                  <header
                     className={`flex items-center justify-between gap-3 border-b border-[#E7E5EC] px-3 py-2 ${headerClassName}`}
                  >
                     <div className='min-w-0 flex-1'>
                        {header}
                     </div>

                     {closable && (
                        <button
                           type='button'
                           onClick={onClose}
                           aria-label='Close dialog'
                           className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#6B6875] transition-colors hover:bg-[#F4F4F7] hover:text-[#2F2D38]'
                        >
                           <X
                              size={20}
                              strokeWidth={1.8}
                              aria-hidden
                           />
                        </button>
                     )}
                  </header>
               )}

               <main
                  className={`flex-1 overflow-y-auto px-5 py-4 ${contentClassName}`}
               >
                  {children}
               </main>

               {footer && (
                  <footer
                     className={`flex items-center justify-end gap-2 border-t border-[#E7E5EC] px-5 py-3 ${footerClassName}`}
                  >
                     {footer}
                  </footer>
               )}
            </div>
         </section>
      </div>
   );
}
