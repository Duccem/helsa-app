import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Container } from "@/components/container";
import Button from "@/components/ui/button";
import { useRecoveryPassword } from "@/lib/auth/use-recovery-password";
import { t } from "@/lib/translation";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const { sending, sendRecoveryEmail } = useRecoveryPassword();
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
            {t("auth.forgetPassword.title")}
          </Text>
          <Text className="text-gray-600 text-center">
            {t("auth.forgetPassword.subtitle")}
          </Text>
          <View className="gap-2">
            <Text className="text-sm text-gray-700">
              {t("auth.forgetPassword.emailLabel")}
            </Text>
            <TextInput
              className="bg-white border rounded-xl px-4 py-3"
              placeholder={t("auth.forgetPassword.emailPlaceholder")}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <Button
            disabled={false}
            className="w-full"
            styles={{ paddingVertical: 10 }}
            action={async () => {
              if (!email) {
                Alert.alert("Error", "Please enter your email address.");
                return;
              }
              await sendRecoveryEmail(email);
              router.push(`/(auth)/change-password?email=${email}`);
            }}
          >
            <Text className="text-white font-semibold">
              {sending ? (
                <ActivityIndicator color={"white"} />
              ) : (
                t("auth.signIn.signInButton")
              )}
            </Text>
          </Button>
        </View>
      </View>
    </Container>
  );
};

export default ForgetPassword;
