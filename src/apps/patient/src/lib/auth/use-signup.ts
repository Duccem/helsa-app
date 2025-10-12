import { useState } from "react";
import { authClient } from "./auth-client";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

export const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const signUp = async (name: string, email: string, password: string, confirm: string) => {
    if (loading) return;
    if (!name || !email || !password || !confirm) {
      throw new Error("Name, email, password and confirm are required");
    }
    if (password !== confirm) {
      throw new Error("Passwords do not match");
    }
    try {
      setLoading(true);
      await authClient.signUp.email({
        email,
        name: name || email.split("@")[0],
        password,
        callbackURL: "/(tabs)",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await authClient.getSession();
      router.replace("/(tabs)");
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e?.error?.message || e?.message || "Sign up error";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }

  return { signUp, loading };
}