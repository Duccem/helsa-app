import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import React, { useRef } from "react";
import { Platform } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { useColorScheme } from "@/lib/use-color-scheme";

export const unstable_settings = {
	initialRouteName: "(drawer)",
};

export default function RootLayout() {
	const hasMounted = useRef(false);
	const { colorScheme, isDarkColorScheme } = useColorScheme();
	const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

	useIsomorphicLayoutEffect(() => {
		if (hasMounted.current) {
			return;
		}

		setAndroidNavigationBar(colorScheme);
		setIsColorSchemeLoaded(true);
		hasMounted.current = true;
	}, []);

	if (!isColorSchemeLoaded) {
		return null;
	}
	return (
		<ThemeProvider value={isDarkColorScheme ? DarkTheme : DefaultTheme}>
			<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
			<Animated.View
				style={{ flex: 1, position: "relative" }}
				entering={FadeIn.duration(300)}
			>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<Stack>
						<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
						<Stack.Screen name="(auth)" options={{ headerShown: false }} />
						<Stack.Screen name="+not-found" />
					</Stack>
				</GestureHandlerRootView>{" "}
			</Animated.View>
		</ThemeProvider>
	);
}

const useIsomorphicLayoutEffect =
	Platform.OS === "web" && typeof window === "undefined"
		? React.useEffect
		: React.useLayoutEffect;
