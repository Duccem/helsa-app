import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { AnimationScreen } from "@/components/animation-screen";
import { useColorScheme } from "@/lib/use-color-scheme";
import LanguageProvider from "@/lib/translation/language-provider";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

export default function RootLayout() {
	const [appReady, setAppReady] = useState(false);
	const { isDarkColorScheme, loadTHeme } = useColorScheme();
	const [loaded] = useFonts({
		Nunito: require("../assets/fonts/nunito.ttf"),
	});

	useEffect(() => {
		const prepare = async () => {
			try {
				await loadTHeme();
			} catch (e) {
				console.error(e);
			}
		};
		prepare();
	}, []);

	useEffect(() => {
		if (loaded) {
			setAppReady(true);
		}
	}, [loaded]);

	if (!appReady || !loaded) {
		return (
			<AnimationScreen
				appReady={appReady}
				finish={(_isCanceled: boolean) => {}}
			/>
		);
	}
	return (
		<ThemeProvider value={isDarkColorScheme ? DarkTheme : DefaultTheme}>
			<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
			<Animated.View
				style={{ flex: 1, position: "relative" }}
				entering={FadeIn.duration(300)}
			>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<LanguageProvider>
						<Stack>
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen name="(auth)" options={{ headerShown: false }} />
							<Stack.Screen name="+not-found" />
						</Stack>
					</LanguageProvider>
				</GestureHandlerRootView>
			</Animated.View>
		</ThemeProvider>
	);
}
