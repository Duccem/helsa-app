import { Redirect, Tabs } from "expo-router";
import { authClient } from "@/lib/auth/auth-client";

export default function TabLayout() {
	const { data: session, isPending } = authClient.useSession();
	if (isPending) {
		return null;
	}
	if (!session) {
		return <Redirect href={"/(auth)/welcome"} />;
	}
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
				}}
			/>
		</Tabs>
	);
}
