import { useState } from "react";
import { authClient } from "./auth-client";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";

export const useOauth = () => {
  const [loadingOauth, setLoadingOauth] = useState(false);
  const signInWithGoogle = async () => {
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/(tabs)",
      },
      {
        onSuccess: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await authClient.getSession();
          setLoadingOauth(false);
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Login error", error.error.message);
          console.warn("Auth signIn error", error.error.message);
          setLoadingOauth(false);
        },
      }
    );
  }
  return { signInWithGoogle, loadingOauth, setLoadingOauth };
}