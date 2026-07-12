import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { useStore } from '../store/useStore';
import { NeonSpinner } from '../components/NeonSpinner';
import { View, StyleSheet } from 'react-native';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import { HabitFormScreen } from '../screens/HabitFormScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CharacterScreen } from '../screens/CharacterScreen';
import { SkillTreeScreen } from '../screens/SkillTreeScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import type {
  AuthStackParamList,
  ContractsStackParamList,
  HomeStackParamList,
  MainTabParamList,
} from './types';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    border: colors.borderBright,
    primary: colors.cyan,
    text: colors.text,
  },
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ContractsStack = createNativeStackNavigator<ContractsStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <HomeStack.Screen name="Dashboard" component={HomeScreen} />
      <HomeStack.Screen name="Profile" component={ProfileScreen} />
    </HomeStack.Navigator>
  );
}

function ContractsStackNavigator() {
  return (
    <ContractsStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <ContractsStack.Screen name="ContractList" component={HabitsScreen} />
      <ContractsStack.Screen name="ContractForm" component={HabitFormScreen} />
      <ContractsStack.Screen name="History" component={CalendarScreen} />
    </ContractsStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  HQ: 'grid',
  Contracts: 'document-text',
  Rig: 'body',
  Implants: 'git-network',
  Net: 'podium',
};

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.borderBright,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 9,
          letterSpacing: 1,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name as keyof MainTabParamList]} size={size - 2} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="HQ" component={HomeStackNavigator} />
      <Tabs.Screen name="Contracts" component={ContractsStackNavigator} />
      <Tabs.Screen name="Rig" component={CharacterScreen} />
      <Tabs.Screen name="Implants" component={SkillTreeScreen} />
      <Tabs.Screen name="Net" component={LeaderboardScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const user = useStore((s) => s.user);
  const authInitialized = useStore((s) => s.authInitialized);

  if (!authInitialized) {
    return (
      <View style={styles.boot}>
        <NeonSpinner label="BOOTING GRID INTERFACE…" />
      </View>
    );
  }

  return <NavigationContainer theme={navTheme}>{user ? <MainTabs /> : <AuthNavigator />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
