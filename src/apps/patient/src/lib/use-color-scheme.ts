import * as SecureStore from "expo-secure-store";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useState } from "react";

export function useColorScheme() {
	const [themeLoaded, setThemeLoaded] = useState(false);
	const { colorScheme, setColorScheme, toggleColorScheme } =
		useNativewindColorScheme();

	const loadTHeme = async () => {
		const storedTheme = await SecureStore.getItemAsync("theme");
		if (storedTheme === "light" || storedTheme === "dark") {
			setColorScheme(storedTheme);
		}
		setThemeLoaded(true);
	};
	return {
		colorScheme: colorScheme ?? "dark",
		isDarkColorScheme: colorScheme === "dark",
		setColorScheme,
		toggleColorScheme,
		loadTHeme,
		themeLoaded,
		setThemeLoaded,
	};
}
