type ForgetPasswordProps = {
  otp: string;
  name?: string;
}
export default function ForgetPassword({ otp, name }: ForgetPasswordProps) {
  return (
    <div
      style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6", color: "#333" }}
    >
      <h1>Forget Password</h1>
      <p>Hi {name ?? "there"},</p>
      <p>You requested to reset your password. Use the OTP below to proceed:</p>
      <h2>{otp}</h2>
      <p>If you did not request this, please ignore this email.</p>
      <p>Best regards,<br />Your Company Team</p>
    </div>
  )
}
