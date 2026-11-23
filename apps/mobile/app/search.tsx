import { useMemo, useState } from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../src/useApi';
import { Screen, TeamBadge } from '../src/ui';
import { API_URL, type Series, type Team } from '../src/api';
import { c, r } from '../src/theme';
import { useTheme } from '../src/ThemeProvider';

export default function Search() {
  useTheme();
  const [q, setQ] = useState('');
  const series = useApi<Series[]>('/series');
  const teams = useApi<Team[]>('/teams');
  const term = q.trim().toLowerCase();
  const foundSeries = useMemo(() => (term ? (series.data ?? []).filter((s) => `${s.name} ${s.short}`.toLowerCase().includes(term)) : []), [series.data, term]);
  const foundTeams = useMemo(() => (term ? (teams.data ?? []).filter((t) => `${t.name} ${t.code}`.toLowerCase().includes(term)) : []), [teams.data, term]);
  const Row = ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) => (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 14 }}>{children}</Pressable>
  );
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: r.pill, paddingHorizontal: 16 }}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Search teams and series" placeholderTextColor={c.muted} returnKeyType="search" autoCorrect={false} style={{ flex: 1, color: c.text, fontSize: 16, paddingVertical: 13 }} accessibilityLabel="Search" />
        {!!q && <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityLabel="Clear"><Ionicons name="close-circle" size={20} color={c.muted} /></Pressable>}
      </View>
      <View style={{ gap: 10, marginTop: 18 }}>
        {foundSeries.length > 0 && <Text style={{ color: c.muted, fontWeight: '800', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>Series</Text>}
        {foundSeries.map((s) => <Row key={s.id} onPress={() => router.push(`/series/${s.id}`)}><Ionicons name="trophy-outline" size={22} color={c.accent} /><Text style={{ color: c.text, fontSize: 16, fontWeight: '600', flex: 1 }}>{s.name}</Text></Row>)}
        {foundTeams.length > 0 && <Text style={{ color: c.muted, fontWeight: '800', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 8 }}>Teams</Text>}
        {foundTeams.map((t) => <Row key={t.id} onPress={() => Linking.openURL(`${API_URL}/team/${t.id}`)}><TeamBadge id={t.id} size={34} refs={{ teams: { [t.id]: { name: t.name, code: t.code, color: t.color } }, players: {} }} /><Text style={{ color: c.text, fontSize: 16, fontWeight: '600', flex: 1 }}>{t.name}</Text><Ionicons name="open-outline" size={16} color={c.muted} /></Row>)}
        {!!term && !foundSeries.length && !foundTeams.length && <Text style={{ color: c.muted, textAlign: 'center', marginTop: 24 }}>No results for “{q}”.</Text>}
        {!term && <Text style={{ color: c.muted, textAlign: 'center', marginTop: 24 }}>Type a team or series name.</Text>}
      </View>
    </Screen>
  );
}
