import { ActivityIndicator, Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { useState } from "react";
import { useSignup } from "@/lib/auth/use-signup";
import { useOauth } from "@/lib/auth/use-oauth";
import { t } from "@/lib/translation";
import { ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Button from "@/components/ui/button";


const SingUp = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const { loading, signUp } = useSignup();
	const { loadingOauth, signInWithGoogle } = useOauth();
	return (
		<Container className="bg-gray-100">
			<View className="flex-1 justify-center items-center w-full gap-8 px-6">
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
				<View className="mt-8 gap-4 w-full">
					<Text className="text-2xl font-bold text-center">{t("auth.signUp.title")}</Text>
					<Text className="text-gray-600 text-center">{t("auth.signUp.subtitle")}</Text>
					<View className="gap-2">
						<Text className="text-sm text-gray-700">{t("auth.signUp.nameLabel")}</Text>
						<TextInput
							className="bg-white border rounded-xl px-4 py-3"
							placeholder={t("auth.signUp.namePlaceholder")}
							autoCapitalize="words"
							value={name}
							onChangeText={setName}
							editable={!loading}
						/>
					</View>
					<View className="gap-2">
						<Text className="text-sm text-gray-700">{t("auth.signUp.emailLabel")}</Text>
						<TextInput
							className="bg-white border rounded-xl px-4 py-3"
							placeholder={t("auth.signUp.emailPlaceholder")}
							autoCapitalize="none"
							keyboardType="email-address"
							value={email}
							onChangeText={setEmail}
							editable={!loading}
						/>
					</View>
					<View className="gap-2">
						<Text className="text-sm text-gray-700">{t("auth.signUp.passwordLabel")}</Text>
						<TextInput
							className="bg-white border rounded-xl px-4 py-3"
							placeholder={t("auth.signUp.passwordPlaceholder")}
							secureTextEntry
							value={password}
							onChangeText={setPassword}
							editable={!loading}
						/>
					</View>
					<View className="gap-2">
						<Text className="text-sm text-gray-700">{t("auth.signUp.confirmPasswordLabel")}</Text>
						<TextInput
							className="bg-white border rounded-xl px-4 py-3"
							placeholder={t("auth.signUp.confirmPasswordPlaceholder")}
							secureTextEntry
							value={confirm}
							onChangeText={setConfirm}
							editable={!loading}
						/>
					</View>
					<Button disabled={loading} action={() => {
						try {
							signUp(name, email, password, confirm);
						} catch (error) {
							Alert.alert("Sign up error", (error as Error).message);
						}
					}}>
						<Text className="text-white font-semibold">
							{loading ? <ActivityIndicator color={'white'} /> : t("auth.signUp.signUpButton")}
						</Text>
					</Button>
					<Button variant="outline" action={signInWithGoogle} disabled={loadingOauth} className="w-full flex-row justify-center items-center gap-2" styles={{ paddingVertical: 10, width: '100%' }}>
						{loadingOauth ? (
							<ActivityIndicator color={"white"} />
						) : (
							<Image
								source={require("@/assets/images/google.png")}
								className="size-8"
								resizeMode="contain"
							/>
						)}
						<Text className="text-black font-semibold">
							{t("auth.signUp.oauthSignUpButton")}
						</Text>
					</Button>

					<View className="flex-row gap-2 justify-center mt-2">
						<Text className="text-gray-700">
							{t("auth.signUp.alreadyHaveAccount")}
						</Text>
						<TouchableOpacity
							onPress={() => router.push("/(auth)/sign-in" as any)}
						>
							<Text className="text-blue-600 font-semibold">
								{t("auth.signUp.goToSignIn")}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Container>
	);
};

export default SingUp;
