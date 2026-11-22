'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';

type Article = { id: string; slug: string; category: string; title: string; excerpt: string; body: string[]; author: string; publishedAt: string; seriesId?: string; teamIds?: string[] };
type Message = { id: number; name: string; email: string; message: string; createdAt: string };
type Opt = { id: string; name: string };

const CATS: [string, string][] = [['news', 'News'], ['analysis', 'Analysis'], ['records', 'Records'], ['prediction', 'Prediction'], ['reactions', 'Reactions'], ['listicles', 'Listicles'], ['stories', 'Stories']];
const catLabel = (c: string) => CATS.find(([k]) => k === c)?.[1] ?? c;
const input = 'w-full min-w-0 rounded-xl border border-line bg-surface2 px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25 sm:text-sm';
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ------------------------------------------------------------------ login */
export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: f.get('username'), password: f.get('password') }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? 'Could not sign in.');
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not sign in.'); setBusy(false); }
  }

  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center py-6">
      <form onSubmit={submit} className="card w-full p-6 sm:p-8" aria-label="Admin sign in">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={56} className="rounded-2xl shadow-lg" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Apex admin</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage news and messages.</p>
        </div>
        {!configured && <p role="alert" className="mb-4 rounded-xl bg-live/10 p-3 text-sm text-live">Admin login is not set up yet. Add <b>ADMIN_PASSWORD</b> (8+ characters) to the server settings and redeploy.</p>}
        <label className="grid gap-1.5 text-sm font-semibold">Username
          <input name="username" autoComplete="username" autoCapitalize="none" autoFocus required className={input} />
        </label>
        <label className="mt-4 grid gap-1.5 text-sm font-semibold">Password
          <span className="relative block">
            <input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className={`${input} pr-16`} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2.5 text-xs font-bold text-muted hover:text-ink">{show ? 'Hide' : 'Show'}</button>
          </span>
        </label>
        <p role="alert" aria-live="polite" className="mt-3 min-h-5 text-sm font-medium text-live">{error}</p>
        <button disabled={busy || !configured} className="btn btn-primary mt-2 w-full disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------- dashboard */
export function AdminApp({ series, teams, dbReady }: { series: Opt[]; teams: Opt[]; dbReady: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<'articles' | 'messages'>('articles');
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [editor, setEditor] = useState<{ article?: Article } | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ text, kind }); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const api = useCallback(async (method: string, url: string, body?: unknown) => {
    const r = await fetch(url, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { router.refresh(); throw new Error('Your session ended. Please sign in again.'); }
    if (!r.ok) throw new Error(j.error ?? `Something went wrong (${r.status})`);
    return j;
  }, [router]);

  const loadArticles = useCallback(async () => { try { setArticles((await api('GET', '/api/admin/articles')).data); } catch (e) { setArticles([]); say((e as Error).message, 'err'); } }, [api, say]);
  const loadMessages = useCallback(async () => { try { setMessages((await api('GET', '/api/admin/messages')).data); } catch (e) { setMessages([]); say((e as Error).message, 'err'); } }, [api, say]);
  useEffect(() => { if (dbReady) { loadArticles(); loadMessages(); } }, [dbReady, loadArticles, loadMessages]);

  const shown = useMemo(() => (articles ?? []).filter((a) => (!cat || a.category === cat) && (!q || `${a.title} ${a.author}`.toLowerCase().includes(q.toLowerCase()))), [articles, q, cat]);

  async function signOut() { await fetch('/api/admin/logout', { method: 'POST' }); router.refresh(); }
  async function removeArticle(a: Article) { try { await api('DELETE', `/api/admin/articles?id=${encodeURIComponent(a.id)}`); say('Article deleted.'); setConfirm(null); loadArticles(); } catch (e) { say((e as Error).message, 'err'); } }
  async function removeMessage(m: Message) { try { await api('DELETE', `/api/admin/messages?id=${m.id}`); say('Message deleted.'); setConfirm(null); loadMessages(); } catch (e) { say((e as Error).message, 'err'); } }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Logo size={40} className="hidden rounded-xl sm:block" />
        <div className="min-w-0 basis-full sm:basis-0 sm:flex-1"><h1 className="font-display text-2xl font-extrabold leading-tight">Newsroom</h1><p className="text-sm text-muted">Publish stories and read messages from visitors.</p></div>
        <a href="/" target="_blank" rel="noopener" className="btn btn-ghost !min-h-10 !px-4 text-sm">View site ↗</a>
        <button type="button" onClick={signOut} className="btn btn-ghost !min-h-10 !px-4 text-sm">Sign out</button>
      </header>

      {!dbReady ? (
        <div className="card p-6 sm:p-8"><h2 className="font-display text-lg font-bold">Connect a database first</h2><p className="mt-2 text-muted">News and messages are stored in Postgres. Add <b>DATABASE_URL</b> in the server settings (for example from Neon), redeploy, and this page will start working.</p></div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Published stories" value={articles ? articles.length : '…'} />
            <Stat label="Messages" value={messages ? messages.length : '…'} />
            <Stat className="col-span-2 sm:col-span-1" label="Last published" value={articles?.[0] ? when(articles[0].publishedAt).split(',')[0] : '—'} />
          </div>

          <div role="tablist" aria-label="Admin sections" className="mb-5 flex gap-1 border-b border-line">
            {(['articles', 'messages'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`utab ${tab === t ? 'utab-on' : ''}`}>
                {t === 'articles' ? 'Articles' : 'Messages'}{t === 'messages' && messages && messages.length > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accentink">{messages.length}</span>}
              </button>
            ))}
          </div>

          {tab === 'articles' && (
            <section aria-label="Articles">
              <div className="mb-4 flex flex-wrap gap-2.5">
                <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search by title or author" aria-label="Search articles" className={`${input} flex-1 basis-48`} />
                <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category" className={`${input} !w-auto`}><option value="">All categories</option>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <button type="button" onClick={() => setEditor({})} className="btn btn-primary !min-h-11 !px-5 text-sm">+ New article</button>
              </div>
              {articles === null ? <Skeleton /> : shown.length === 0 ? (
                <div className="card p-10 text-center"><p className="font-display text-lg font-bold">{articles.length ? 'No articles match your search' : 'No stories yet'}</p><p className="mt-1 text-sm text-muted">{articles.length ? 'Try a different word or category.' : 'Write your first story and it will appear on the home page and in News.'}</p>{!articles.length && <button type="button" onClick={() => setEditor({})} className="btn btn-primary mt-5">Write the first story</button>}</div>
              ) : (
                <ul className="card divide-y divide-line overflow-hidden">
                  {shown.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1 basis-60">
                        <p className="truncate font-semibold">{a.title}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted"><span className="rounded-full bg-accent/15 px-2 py-0.5 font-bold text-accent">{catLabel(a.category)}</span>{a.author} · {when(a.publishedAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={`/news/${a.slug}`} target="_blank" rel="noopener" className="chip">View ↗</a>
                        <button type="button" onClick={() => setEditor({ article: a })} className="chip">Edit</button>
                        {confirm === a.id ? (<><button type="button" onClick={() => removeArticle(a)} className="chip !border-live !bg-live !text-white">Yes, delete</button><button type="button" onClick={() => setConfirm(null)} className="chip">Cancel</button></>) : <button type="button" onClick={() => setConfirm(a.id)} className="chip hover:!border-live hover:!text-live">Delete</button>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === 'messages' && (
            <section aria-label="Messages">
              {messages === null ? <Skeleton /> : messages.length === 0 ? <div className="card p-10 text-center"><p className="font-display text-lg font-bold">No messages yet</p><p className="mt-1 text-sm text-muted">Messages sent through the Contact page show up here.</p></div> : (
                <ul className="grid gap-3">
                  {messages.map((m) => (
                    <li key={m.id} className="card p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0"><p className="font-semibold">{m.name}</p><a href={`mailto:${m.email}`} className="break-all text-sm text-accent hover:underline">{m.email}</a></div>
                        <p className="text-xs text-muted">{when(m.createdAt)}</p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{m.message}</p>
                      <div className="mt-3 flex gap-2">
                        <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Apex')}`} className="chip">Reply</a>
                        {confirm === `m${m.id}` ? (<><button type="button" onClick={() => removeMessage(m)} className="chip !border-live !bg-live !text-white">Yes, delete</button><button type="button" onClick={() => setConfirm(null)} className="chip">Cancel</button></>) : <button type="button" onClick={() => setConfirm(`m${m.id}`)} className="chip hover:!border-live hover:!text-live">Delete</button>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {editor && <Editor article={editor.article} series={series} teams={teams} api={api} onClose={() => setEditor(null)} onSaved={(slug, edited) => { setEditor(null); say(edited ? 'Changes saved.' : `Published! It is live at /news/${slug}`); loadArticles(); }} onError={(m) => say(m, 'err')} />}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 lg:bottom-8">
        {toast && <p className={`page-in pointer-events-auto max-w-md rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl ${toast.kind === 'ok' ? 'bg-ink text-bg' : 'bg-live text-white'}`}>{toast.text}</p>}
      </div>
    </div>
  );
}

function Stat({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return <div className={`card p-4 ${className}`}><p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p><p className="num mt-1 font-display text-2xl font-extrabold">{value}</p></div>;
}
function Skeleton() { return <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>; }

/* ----------------------------------------------------------------- editor */
function Editor({ article, series, teams, api, onClose, onSaved, onError }: {
  article?: Article; series: Opt[]; teams: Opt[];
  api: (m: string, u: string, b?: unknown) => Promise<{ slug: string }>;
  onClose: () => void; onSaved: (slug: string, edited: boolean) => void; onError: (m: string) => void;
}) {
  const editing = !!article;
  const [title, setTitle] = useState(article?.title ?? '');
  const [category, setCategory] = useState(article?.category ?? 'news');
  const [author, setAuthor] = useState(article?.author ?? '');
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '');
  const [body, setBody] = useState(article?.body.join('\n\n') ?? '');
  const [seriesId, setSeriesId] = useState(article?.seriesId ?? '');
  const [teamIds, setTeamIds] = useState<string[]>(article?.teamIds ?? []);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const lenis = window.__lenis; lenis?.stop();
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { lenis?.start(); document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 5) return onError('Please write a headline of at least 5 characters.');
    if (!body.trim()) return onError('The story text is empty.');
    setBusy(true);
    try {
      const j = await api('POST', '/api/admin/articles', { id: article?.id, slug: article?.slug, title, category, author: author || undefined, excerpt: excerpt || undefined, body, seriesId: seriesId || undefined, teamIds });
      onSaved(j.slug, editing);
    } catch (err) { onError((err as Error).message); setBusy(false); }
  }
  const toggleTeam = (id: string) => setTeamIds((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={editing ? 'Edit article' : 'New article'}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={save} data-lenis-prevent className="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold">{editing ? 'Edit article' : 'New article'}</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPreview((p) => !p)} className="chip">{preview ? 'Back to editing' : 'Preview'}</button>
            <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full border border-line">✕</button>
          </div>
        </div>

        <div className="grid gap-4 overflow-y-auto overscroll-contain p-5">
          {preview ? (
            <article className="mx-auto w-full max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-accent">{catLabel(category)}</p>
              <h3 className="mt-2 font-display text-3xl font-extrabold leading-tight">{title || 'Your headline'}</h3>
              <p className="mt-3 text-sm text-muted">By {author || 'Apex Desk'}</p>
              <div className="mt-5 grid gap-4 leading-relaxed">{body.split(/\n{2,}/).filter((p) => p.trim()).map((p, i) => <p key={i} className={i === 0 ? 'text-lg font-medium' : 'text-muted'}>{p}</p>)}{!body.trim() && <p className="text-muted">Your story text will appear here.</p>}</div>
            </article>
          ) : (
            <>
              <label className="grid gap-1.5 text-sm font-semibold">Headline
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. Australia clinch thriller in Adelaide" autoFocus className={input} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold">Category
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">Author <span className="font-normal text-muted">(optional)</span>
                  <input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={80} placeholder="Apex Desk" className={input} />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm font-semibold">Story
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={11} placeholder={'Write the story here.\n\nLeave a blank line to start a new paragraph.'} className={`${input} leading-relaxed`} />
                <span className="text-xs font-normal text-muted">{words} words · a blank line starts a new paragraph</span>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">Short summary <span className="font-normal text-muted">(optional, shown in lists; defaults to the first paragraph)</span>
                <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={300} className={input} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">Related series <span className="font-normal text-muted">(optional)</span>
                <select value={seriesId} onChange={(e) => setSeriesId(e.target.value)} className={input}><option value="">None</option>{series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </label>
              <fieldset className="grid gap-2">
                <legend className="mb-1.5 text-sm font-semibold">Related teams <span className="font-normal text-muted">(optional, tap to select)</span></legend>
                <div className="flex flex-wrap gap-2">{teams.map((t) => <button key={t.id} type="button" aria-pressed={teamIds.includes(t.id)} onClick={() => toggleTeam(t.id)} className={`chip ${teamIds.includes(t.id) ? 'active' : ''}`}>{t.name}</button>)}</div>
              </fieldset>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-line bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="btn btn-ghost !min-h-11 text-sm">Cancel</button>
          <button disabled={busy} className="btn btn-primary !min-h-11 text-sm disabled:opacity-60">{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish'}</button>
        </div>
      </form>
    </div>
  );
}
