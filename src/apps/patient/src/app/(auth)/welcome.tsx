import LottieView from "lottie-react-native";
import { Image, Text, View } from "react-native";
import { Container } from "@/components/container";
import Button from "@/components/ui/button";
import { t } from "@/lib/translation";
import { router } from "expo-router";

const Welcome = () => {
	return (
		<Container className="bg-primary">
			<View className=" flex-1 items-center justify-center px-6 gap-12">
				<LottieView
					style={{
						width: 300,
						height: 300,
					}}
					autoPlay
					source={require("@/assets/animations/Meditation.json")}
				/>
				<View className="gap-1">
					<Text className="mt-4 text-center font-nunito text-2xl text-white font-bold">
						{t('welcome.title')}
					</Text>
					<Text className="mt-2 text-center font-nunito font-semibold text-base text-white">
						{t('welcome.subtitle')}
					</Text>
				</View>
				<Button
					variant="white"
					className="w-full"
					styles={{ paddingVertical: 10 }}
					action={() => router.push("/(auth)/sign-in")}
				>
					<Text className="font-nunito text-lg text-primary font-bold">
						{t('welcome.getStarted')}
					</Text>
				</Button>
				<Image
					source={require("@/assets/images/logo-white.png")}
					className="h-12 mb-4"
					resizeMode="contain"
				/>
			</View>
		</Container>
	);
};

export default Welcome;
