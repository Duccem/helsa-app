import { useState } from "react";
import { authClient } from "./auth-client";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Alert } from "react-native";
import { t } from "@/lib/translation";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const signIn = async (email: string, password: string) => {
    if (loading) return;
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    try {
      setLoading(true);
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/(tabs)",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await authClient.getSession();
      router.replace("/(tabs)");
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e?.error?.message || e?.message || t("auth.signInErrorTitle");
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }

  return { signIn, loading };
}