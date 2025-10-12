import type React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export const Container = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<SafeAreaView className={`flex-1 ${className}`}>{children}</SafeAreaView>
	);
};
