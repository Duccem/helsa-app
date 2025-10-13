import { useState } from "react";
import { authClient } from "./auth-client";

export const useRecoveryPassword = () => {
	const [sending, setSending] = useState(false);
	const [changing, setChanging] = useState(false);
	const [verifying, setVerifying] = useState(false);

	const sendRecoveryEmail = async (email: string) => {
		setSending(true);
		await authClient.forgetPassword.emailOtp({
			email,
		});
		setSending(false);
	};

	const verifyOtp = async (otp: string, email: string) => {
		setVerifying(true);
		await authClient.emailOtp.checkVerificationOtp({
			email,
			otp,
			type: "forget-password",
		});
		setVerifying(false);
	};

	const resetPassword = async (
		otp: string,
		newPassword: string,
		email: string,
	) => {
		setChanging(true);
		await authClient.emailOtp.resetPassword({
			email,
			otp,
			password: newPassword,
		});
		setChanging(false);
	};

	return {
		sending,
		sendRecoveryEmail,
		resetPassword,
		changing,
		verifyOtp,
		verifying,
	};
};
