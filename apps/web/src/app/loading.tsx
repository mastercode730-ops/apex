/** Shown instantly while a dynamic page is fetching data, so navigation never feels stuck. */
export default function Loading() {
  return (
    <div className="grid gap-8" role="status" aria-label="Loading">
      <div className="skeleton h-9 w-2/3 max-w-md" />
      <div className="skeleton h-40 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
      </div>
    </div>
  );
}
