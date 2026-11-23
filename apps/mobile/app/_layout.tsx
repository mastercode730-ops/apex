import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from '../src/ThemeProvider';
import { c } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return <ThemeProvider><Shell /></ThemeProvider>;
}

function Shell() {
  const { scheme, ready } = useTheme();
  // Load the icon font up front so no icon is ever drawn blank, and wait for the saved theme to avoid a colour flash.
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const go = (fontsLoaded || !!fontError) && ready;
  useEffect(() => { if (go) SplashScreen.hideAsync().catch(() => {}); }, [go]);
  if (!go) return null;
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerStyle: { backgroundColor: c.bg }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '800' }, contentStyle: { backgroundColor: c.bg }, headerShadowVisible: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Match' }} />
        <Stack.Screen name="series/[id]" options={{ title: 'Series' }} />
        <Stack.Screen name="news/[slug]" options={{ title: 'News' }} />
        <Stack.Screen name="rankings" options={{ title: 'Rankings' }} />
        <Stack.Screen name="search" options={{ title: 'Search', animation: 'fade' }} />
      </Stack>
    </>
  );
}
