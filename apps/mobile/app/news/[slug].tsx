import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useApi } from '../../src/useApi';
import { FadeIn, Screen } from '../../src/ui';
import { ago, type Article } from '../../src/api';
import { c } from '../../src/theme';
import { useTheme } from '../../src/ThemeProvider';

export default function ArticleScreen() {
  useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, loading, error } = useApi<Article>(`/news/${slug}`);
  return (
    <Screen loading={loading} error={error}>
      <Stack.Screen options={{ title: data?.category ? data.category[0].toUpperCase() + data.category.slice(1) : 'News' }} />
      {data && (
        <FadeIn>
          <Text style={{ color: c.text, fontSize: 28, fontWeight: '800', lineHeight: 34, letterSpacing: -0.5 }}>{data.title}</Text>
          <Text style={{ color: c.muted, marginTop: 8, fontSize: 13 }}>By {data.author} · {ago(data.publishedAt)}</Text>
          <View style={{ marginTop: 20, gap: 16 }}>
            {data.body.map((p, i) => <Text key={i} style={{ color: i === 0 ? c.text : c.muted, fontSize: i === 0 ? 18 : 16, lineHeight: 25, fontWeight: i === 0 ? '600' : '400' }}>{p}</Text>)}
          </View>
        </FadeIn>
      )}
    </Screen>
  );
}
