import Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";
import { ArrowLeft, X } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Container } from "@/components/container";
import Button from "@/components/ui/button";
import { useRecoveryPassword } from "@/lib/auth/use-recovery-password";
import { t } from "@/lib/translation";

const ChangePassword = () => {
  const { email, code } = useLocalSearchParams<{
    email?: string;
    code?: string;
  }>();
  const [newPassword, setNewPassword] = useState("");
  const { changing, resetPassword } = useRecoveryPassword();
  const [showModal, setShowModal] = useState(false);
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
            {t("auth.changePassword.title")}
          </Text>
          <Text className="text-gray-600 text-center">
            {t("auth.changePassword.subtitle")}
          </Text>
          <View className="gap-2">
            <Text className="text-sm text-gray-700">
              {t("auth.changePassword.newPasswordLabel")}
            </Text>
            <TextInput
              className="bg-white border rounded-xl px-4 py-3"
              placeholder={t("auth.changePassword.newPasswordPlaceholder")}
              autoCapitalize="none"
              keyboardType="email-address"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>
          <Button
            disabled={false}
            className="w-full"
            styles={{ paddingVertical: 10 }}
            action={async () => {
              if (!newPassword) {
                Alert.alert("Error", "Please enter your new password.");
                return;
              }
              await resetPassword(code ?? "", newPassword, email ?? "");
              setShowModal(true);
            }}
          >
            <Text className="text-white font-semibold">
              {changing ? (
                <ActivityIndicator color={"white"} />
              ) : (
                t("auth.changePassword.changePasswordButton")
              )}
            </Text>
          </Button>
          <TouchableOpacity
            className="w-full"
            onPress={() => {
              router.push("/(auth)/sign-in");
            }}
          >
            <Text className="text-center ">
              {t("auth.changePassword.backToSignIn")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {showModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={() => {
            setShowModal(!showModal);
          }}
        >
          <TouchableOpacity
            className="flex-1 justify-center items-center bg-black/40 bg-opacity-50"
            onPress={() => setShowModal(false)}
          >
            <View className="bg-white rounded-lg p-6 w-4/5">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold mb-4">Success</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X />
                </TouchableOpacity>
              </View>
              <LottieView
                source={require("@/assets/animations/success_animation.json")}
                autoPlay
                loop={false}
                style={{ width: 250, height: 250, alignSelf: "center" }}
              />
              <Text className="mb-4">
                Your password has been changed successfully.
              </Text>
              <Button
                className="w-full"
                styles={{ paddingVertical: 10 }}
                action={() => {
                  setShowModal(false);
                  router.push("/(auth)/sign-in");
                }}
              >
                <Text className="text-white font-semibold">Go to Sign In</Text>
              </Button>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </Container>
  );
};

export default ChangePassword;
