// Envoltorio delgado sobre @radix-ui/react-dialog (mismo proveedor que ya usa el switch de
// Perfil) — modal accesible de verdad (foco atrapado, cierre con Escape, aria-* correctos) en
// vez de reinventar un <div> con position:fixed a mano.
import { forwardRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export const DialogContent = forwardRef(function DialogContent({ className = '', children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
      <DialogPrimitive.Content
        ref={ref}
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none max-h-[85vh] overflow-y-auto data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 ${className}`}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md text-ink/40 hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral" aria-label="Cerrar">
          <X className="w-5 h-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
