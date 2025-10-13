import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Container } from "@/components/container";
import Button from "@/components/ui/button";
import InputOTP from "@/components/ui/otp-input";
import { useRecoveryPassword } from "@/lib/auth/use-recovery-password";
import { t } from "@/lib/translation";

const CheckEmail = () => {
  const { email } = useLocalSearchParams<{
    email?: string
  }>();
  const [code, setCode] = useState("");
  const { verifying, verifyOtp, sending, sendRecoveryEmail } = useRecoveryPassword();
  const [secondsLeft, setSecondsLeft] = useState(20);

  // Countdown timer for resend email
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);
  return (
    <Container className="bg-white">
      <View className="flex-1 px-6 justify-center items-center">
        <View className="w-full justify-center items-center">
          <Image
            source={require("@/assets/images/logo-primary-black.png")}
            className="h-12 mb-4"
            resizeMode="contain"
          />
          <TouchableOpacity
            className="flex-row items-center gap-2"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.back();
            }}
          >
            <ArrowLeft size={20} color={"black"} />
            <Text className="text-xl text-foreground">{t("common.back")}</Text>
          </TouchableOpacity>
        </View>
        <View className="mt-8 w-full gap-4">
          <Text className="text-2xl font-bold text-center">
            {t("auth.checkEmail.title")}
          </Text>
          <Text className="text-gray-600 text-center">
            {t("auth.checkEmail.subtitle")}
          </Text>
          <InputOTP setCode={setCode} />
          <Button
            disabled={false}
            className="w-full"
            styles={{ paddingVertical: 10 }}
            action={async () => {
              if (!code) {
                Alert.alert("Error", "Please enter your email address.");
                return;
              }
              await verifyOtp(code, email ?? '');
              router.push(`/(auth)/change-password?email=${email}&otp=${code}`);
            }}
          >
            <Text className="text-white font-semibold">
              {verifying ? (
                <ActivityIndicator color={"white"} />
              ) : (
                t("auth.signIn.signInButton")
              )}
            </Text>
          </Button>
          <TouchableOpacity
            className="w-full"
            disabled={secondsLeft > 0 || sending || !email}
            onPress={async () => {
              if (!email) {
                Alert.alert("Error", "Missing email address.");
                return;
              }
              try {
                await sendRecoveryEmail(email);
                setSecondsLeft(20);
                Alert.alert(t("common.success"), t("auth.checkEmail.emailResent") ?? "Email resent.");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to resend email.";
                Alert.alert(t("common.error"), message);
              }
            }}
          >
            <Text
              className={`text-center ${secondsLeft > 0 || sending || !email ? "text-gray-400" : ""}`}
            >
              {secondsLeft > 0
                ? `${t("auth.checkEmail.resendEmailButton")} (${secondsLeft}s)`
                : sending
                  ? t("common.sending")
                  : t("auth.checkEmail.resendEmailButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
};

export default CheckEmail;
