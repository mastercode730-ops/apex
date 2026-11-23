import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/ui';
import { API_URL } from '../../src/api';
import { c } from '../../src/theme';
import { Icon } from '../../src/icons';
import { useTheme } from '../../src/ThemeProvider';

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; hint?: string; onPress: () => void };
const web = (path: string) => () => Linking.openURL(`${API_URL}${path}`);

export default function More() {
  const { mode, setMode } = useTheme();
  const groups: { title: string; items: Item[] }[] = [
    { title: 'Explore', items: [
      { icon: 'search', label: 'Search', hint: 'Teams and series', onPress: () => router.push('/search') },
      { icon: 'stats-chart', label: 'Rankings', hint: 'Team rankings: Test, ODI, T20I', onPress: () => router.push('/rankings') },
      { icon: 'calendar', label: 'Fixtures', hint: 'All upcoming matches', onPress: () => router.navigate('/matches') },
      { icon: 'globe-outline', label: 'Open website', onPress: web('/') },
    ] },
    { title: 'Apex', items: [
      { icon: 'mail-outline', label: 'Contact us', onPress: web('/contact') },
      { icon: 'shield-checkmark-outline', label: 'Privacy Policy', onPress: web('/privacy-policy') },
      { icon: 'document-text-outline', label: 'Terms & Conditions', onPress: web('/terms-and-conditions') },
      { icon: 'newspaper-outline', label: 'Editorial Policy', onPress: web('/editorial-policy') },
    ] },
  ];
  return (
    <Screen>
      <View style={{ marginBottom: 22 }}>
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>Appearance</Text>
        <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.line, padding: 5, gap: 5 }}>
          {([['system', 'System', 'grid'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']] as const).map(([key, label, ic]) => {
            const on = mode === key;
            return (
              <Pressable key={key} onPress={() => setMode(key)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label + ' theme'} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: on ? c.accent : 'transparent' }}>
                <Icon name={ic} color={on ? c.accentInk : c.muted} size={20} />
                <Text style={{ color: on ? c.accentInk : c.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {groups.map((g) => (
        <View key={g.title} style={{ marginBottom: 22 }}>
          <Text style={{ color: c.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>{g.title}</Text>
          <View style={{ backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
            {g.items.map((it, i) => (
              <Pressable key={it.label} onPress={it.onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, backgroundColor: pressed ? c.surface2 : 'transparent' })}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={it.icon} size={20} color={c.accent} /></View>
                <View style={{ flex: 1 }}><Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{it.label}</Text>{it.hint && <Text style={{ color: c.muted, fontSize: 12.5, marginTop: 2 }}>{it.hint}</Text>}</View>
                <Ionicons name="chevron-forward" size={18} color={c.muted} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Text style={{ color: c.muted, textAlign: 'center', fontSize: 12 }}>Apex Cricket · live scores, scorecards and stats</Text>
    </Screen>
  );
}
