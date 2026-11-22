import { Image, Text, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { c } from '../../src/theme';

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color as string} />;

function Brand() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Image source={require('../../assets/favicon.png')} style={{ width: 30, height: 30, borderRadius: 8 }} />
      <Text style={{ color: c.text, fontWeight: '800', fontSize: 18, letterSpacing: 1 }}>APEX</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: c.bg }, headerTintColor: c.text, headerTitleStyle: { fontWeight: '800' }, headerShadowVisible: false,
      tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line }, tabBarActiveTintColor: c.accent, tabBarInactiveTintColor: c.muted,
      tabBarLabelStyle: { fontWeight: '700', fontSize: 11 }, sceneStyle: { backgroundColor: c.bg },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Live', headerTitle: () => <Brand />, tabBarIcon: icon('radio-outline') }} />
      <Tabs.Screen name="fixtures" options={{ title: 'Fixtures', tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen name="series" options={{ title: 'Series', tabBarIcon: icon('trophy-outline') }} />
      <Tabs.Screen name="rankings" options={{ title: 'Rankings', tabBarIcon: icon('stats-chart-outline') }} />
      <Tabs.Screen name="news" options={{ title: 'News', tabBarIcon: icon('newspaper-outline') }} />
    </Tabs>
  );
}
