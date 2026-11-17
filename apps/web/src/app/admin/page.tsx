'use client';
import { useCallback, useState } from 'react';

type A = { id: string; slug: string; title: string; category: string; author: string; publishedAt: string };
const CATS = ['news', 'records', 'analysis', 'prediction', 'reactions', 'listicles', 'stories'];
const field = 'w-full rounded-xl border border-line bg-surface2 px-4 py-2.5 outline-none focus:border-accent';

export default function Admin() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<A[] | null>(null);
  const [msg, setMsg] = useState('');

  const call = useCallback(async (method: string, url = '/api/admin/articles', body?: unknown) => {
    const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json(); if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`); return j;
  }, [token]);
  const load = useCallback(async () => { try { setItems((await call('GET')).data); setMsg(''); } catch (e) { setItems(null); setMsg((e as Error).message); } }, [call]);

  async function publish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try { const j = await call('POST', '/api/admin/articles', { ...f, teamIds: f.teamIds ? f.teamIds.split(',').map((s) => s.trim()).filter(Boolean) : [] }); setMsg(`Published: /news/${j.slug}`); (e.target as HTMLFormElement).reset(); load(); }
    catch (err) { setMsg((err as Error).message); }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <h1 className="font-display text-3xl font-extrabold">Newsroom admin</h1>
      <div className="card flex gap-3 p-4">
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" aria-label="Admin token" className={field} />
        <button onClick={load} className="rounded-xl bg-accent px-5 font-bold text-accentink">Unlock</button>
      </div>
      {msg && <p role="status" className="text-sm text-accent">{msg}</p>}
      {items && (
        <>
          <form onSubmit={publish} className="card grid gap-3 p-6">
            <h2 className="font-display text-lg font-bold">New article</h2>
            <input name="title" required minLength={5} placeholder="Headline" className={field} />
            <div className="grid grid-cols-2 gap-3">
              <select name="category" className={field}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <input name="author" placeholder="Author (default: Apex Desk)" className={field} />
            </div>
            <input name="excerpt" placeholder="Short summary (optional)" className={field} />
            <textarea name="body" required rows={10} placeholder="Body. Separate paragraphs with a blank line." className={field} />
            <div className="grid grid-cols-2 gap-3"><input name="seriesId" placeholder="Series id (optional)" className={field} /><input name="teamIds" placeholder="Team ids, comma separated" className={field} /></div>
            <button className="rounded-xl bg-accent px-5 py-3 font-bold text-accentink">Publish</button>
          </form>
          <section className="card divide-y divide-line">
            {items.length === 0 && <p className="p-5 text-muted">No articles yet.</p>}
            {items.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 p-4">
                <div><a href={`/news/${a.slug}`} className="font-semibold hover:underline">{a.title}</a><p className="text-xs text-muted">{a.category} · {a.author} · {new Date(a.publishedAt).toLocaleDateString()}</p></div>
                <button onClick={async () => { if (confirm(`Delete "${a.title}"?`)) { await call('DELETE', `/api/admin/articles?id=${encodeURIComponent(a.id)}`); load(); } }} className="chip">Delete</button>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
