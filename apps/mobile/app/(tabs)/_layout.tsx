import { View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/kit';
import { Icon, type IconName } from '../../src/icons';
import { useTheme } from '../../src/ThemeProvider';
import { c, tint } from '../../src/theme';

/** Bottom-bar icon (drawn vector) with a soft pill behind it when selected. */
const tab = (name: IconName) => ({ color, focused }: { color: ColorValue; focused: boolean }) => (
  <View style={{ width: 58, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: focused ? tint(c.accent, 0.16) : 'transparent' }}>
    <Icon name={name} color={color as string} active={focused} size={24} />
  </View>
);

export default function TabsLayout() {
  useTheme(); // re-render (and re-colour the bar) when the theme changes
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      header: () => <AppHeader />,
      tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line, height: 68 + bottom, paddingTop: 6, paddingBottom: Math.max(bottom, 8) },
      tabBarActiveTintColor: c.accent, tabBarInactiveTintColor: c.muted,
      tabBarLabelStyle: { fontWeight: '700', fontSize: 11.5 }, sceneStyle: { backgroundColor: c.bg },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tab('home') }} />
      <Tabs.Screen name="series" options={{ title: 'Series', tabBarIcon: tab('trophy') }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: tab('ball') }} />
      <Tabs.Screen name="news" options={{ title: 'News', tabBarIcon: tab('news') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tab('grid') }} />
    </Tabs>
  );
}
