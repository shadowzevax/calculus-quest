import * as SwitchPrimitive from '@radix-ui/react-switch'

export function Switch({ className = '', ...props }) {
  return (
    <SwitchPrimitive.Root
      className={`w-11 h-6 shrink-0 rounded-full bg-ink/15 data-[state=checked]:bg-coral transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-coral/40 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block w-5 h-5 rounded-full bg-white shadow translate-x-0.5 data-[state=checked]:translate-x-[22px] transition-transform" />
    </SwitchPrimitive.Root>
  )
}
