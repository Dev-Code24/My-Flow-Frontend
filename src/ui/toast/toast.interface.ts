export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
   id: number;
   message: string;
   variant: ToastVariant;
   duration: number;
   visible: boolean;
   position: ToastPosition;
}

export interface ToastOptions {
   variant?: ToastVariant;
   duration?: number;
   position?: ToastPosition;
}

export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";