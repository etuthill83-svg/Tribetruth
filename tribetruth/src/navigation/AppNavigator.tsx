import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BlessingDetailScreen from '../screens/BlessingDetailScreen';
import BlessingsListScreen from '../screens/BlessingsListScreen';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  BlessingsList: undefined;
  BlessingDetail: { id: string };
  Progress: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        },
        headerShadowVisible: true,
        headerTintColor: '#FFD700',
        headerTitleStyle: {
          color: '#FFD700',
          fontWeight: '600',
        },
        headerBlurEffect: 'dark',
        headerRight: () => (
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="settings-outline" size={24} color="#FFD700" />
          </Pressable>
        ),
      })}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="BlessingsList"
        component={BlessingsListScreen}
        options={{ title: 'Blessings' }}
      />
      <Stack.Screen
        name="BlessingDetail"
        component={BlessingDetailScreen}
        options={{ title: 'Blessing' }}
      />
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: 'Progress' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}
