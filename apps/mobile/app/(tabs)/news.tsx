import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApi } from '../../src/useApi';
import { Chip, FadeIn, Screen } from '../../src/ui';
import { ago, type Article, type Team } from '../../src/api';
import { c } from '../../src/theme';
import { useTheme } from '../../src/ThemeProvider';

const LABEL: Record<string, string> = { news: 'News', analysis: 'Analysis', records: 'Records', prediction: 'Prediction', reactions: 'Reactions', listicles: 'Listicles', stories: 'Stories' };

export default function News() {
  useTheme();
  const { data, loading, error, refreshing, refresh } = useApi<Omit<Article, 'body'>[]>('/news?limit=40', 60_000);
  const teams = useApi<Team[]>('/teams', 300_000);
  const [cat, setCat] = useState('');
  const colors = useMemo(() => Object.fromEntries((teams.data ?? []).map((t) => [t.id, t.color])), [teams.data]);
  const cats = useMemo(() => [...new Set((data ?? []).map((a) => a.category))], [data]);
  const list = (data ?? []).filter((a) => !cat || a.category === cat);
  const [lead, ...rest] = list;

  return (
    <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh} empty={data && !data.length ? 'No stories published yet.' : undefined}>
      {cats.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
          <Chip label="Top Headlines" active={!cat} onPress={() => setCat('')} />
          {cats.map((x) => <Chip key={x} label={LABEL[x] ?? x} active={cat === x} onPress={() => setCat(x)} />)}
        </ScrollView>
      )}
      {lead && (
        <FadeIn>
          <Pressable onPress={() => router.push(`/news/${lead.slug}`)} accessibilityRole="button" style={{ height: 230, borderRadius: 20, overflow: 'hidden', backgroundColor: colors[lead.teamIds?.[0] ?? ''] ?? c.surface2, justifyContent: 'flex-end' }}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,8,20,0.55)' }} />
            <View style={{ padding: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>{LABEL[lead.category] ?? lead.category}</Text>
              <Text style={{ color: '#fff', fontSize: 21, fontWeight: '800', lineHeight: 27, marginTop: 4 }} numberOfLines={3}>{lead.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6 }}>{lead.author} · {ago(lead.publishedAt)}</Text>
            </View>
          </Pressable>
        </FadeIn>
      )}
      <View style={{ marginTop: 8 }}>
        {rest.map((a, i) => (
          <FadeIn key={a.id} index={i}>
            <Pressable onPress={() => router.push(`/news/${a.slug}`)} accessibilityRole="button" style={{ flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line }}>
              <View style={{ width: 88, height: 88, borderRadius: 12, backgroundColor: colors[a.teamIds?.[0] ?? ''] ?? c.surface2 }} />
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ color: c.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{LABEL[a.category] ?? a.category}</Text>
                <Text style={{ color: c.text, fontSize: 16.5, fontWeight: '600', lineHeight: 22, marginTop: 3 }} numberOfLines={3}>{a.title}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 6, textTransform: 'uppercase' }}>{a.author} · {ago(a.publishedAt)}</Text>
              </View>
            </Pressable>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}
