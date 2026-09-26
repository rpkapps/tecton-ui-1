// Synced from shadcn/ui (apps/v4/examples/base/input-otp-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@tecton/react/components/input-otp"

export function InputOTPDemo() {
  return (
    <InputOTP maxLength={6} defaultValue="123456">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
