import { Text, View } from "react-native";
import { Container } from "@/components/container";

const Welcome = () => {
	return (
		<Container>
			<View>
				<Text>
					Welcome to the app! This is the welcome screen for authenticated
					users.
				</Text>
			</View>
		</Container>
	);
};

export default Welcome;
