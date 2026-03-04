/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { Text, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <View style={{width: "100%", height: "100%", backgroundColor: "white", display: "flex", justifyContent: "center", alignItems: "center"}}>
        <Text style={{fontWeight:"800", fontSize: 24}}>MADHAV AI</Text>
      </View>
    </SafeAreaProvider>
  );
}

export default App;
