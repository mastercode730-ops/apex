import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { c } from '../src/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: c.bg }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '800' }, contentStyle: { backgroundColor: c.bg }, headerShadowVisible: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Match' }} />
        <Stack.Screen name="series/[id]" options={{ title: 'Series' }} />
        <Stack.Screen name="news/[slug]" options={{ title: 'News' }} />
      </Stack>
    </>
  );
}
