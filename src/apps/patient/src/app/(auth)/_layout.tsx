import { Redirect, Stack } from "expo-router";
import { authClient } from "@/lib/auth-client";

const Layout = () => {
	const { data: session, isPending } = authClient.useSession();
	if (isPending) return null;
	if (session) {
		return <Redirect href={"/(tabs)"} />;
	}
	return (
		<Stack
			screenOptions={{
				animation: "fade_from_bottom",
				animationDuration: 10,
				contentStyle: { flex: 1, backgroundColor: "#fff" },
			}}
		>
			<Stack.Screen name="welcome" options={{ headerShown: false }} />
			<Stack.Screen name="sign-in" options={{ headerShown: false }} />
			<Stack.Screen name="sign-up" options={{ headerShown: false }} />
		</Stack>
	);
};

export default Layout;
