import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApi } from '../../src/useApi';
import { FadeIn, Screen, st } from '../../src/ui';
import { ago, type Article } from '../../src/api';
import { c } from '../../src/theme';

export default function News() {
  const { data, loading, error, refreshing, refresh } = useApi<Omit<Article, 'body'>[]>('/news?limit=40', 60_000);
  return (
    <Screen loading={loading} error={error} refreshing={refreshing} onRefresh={refresh} empty={data && !data.length ? 'No stories published yet.' : undefined}>
      <View style={{ gap: 12 }}>
        {(data ?? []).map((a, i) => (
          <FadeIn key={a.id} index={i}>
            <Pressable onPress={() => router.push(`/news/${a.slug}`)} style={({ pressed }) => [st.card, pressed && { borderColor: c.accent }]} accessibilityRole="button">
              <Text style={{ color: c.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{a.category}</Text>
              <Text style={{ color: c.text, fontSize: 17, fontWeight: '800', lineHeight: 23 }}>{a.title}</Text>
              <Text style={{ color: c.muted, fontSize: 14 }} numberOfLines={3}>{a.excerpt}</Text>
              <Text style={st.muted}>{a.author} · {ago(a.publishedAt)}</Text>
            </Pressable>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}
