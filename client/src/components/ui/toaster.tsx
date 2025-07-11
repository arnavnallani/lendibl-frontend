import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="sm:data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] sm:data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] sm:data-[swipe=cancel]:translate-x-0 sm:data-[state=closed]:slide-out-to-right-full data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y)] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)] data-[swipe=cancel]:translate-y-0 data-[state=closed]:slide-out-to-top-full sm:data-[state=closed]:slide-out-to-right-full">
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
