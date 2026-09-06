export default function AppNotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-semibold text-ink">Not found</h1>
      <p className="mt-2 text-sm text-steel">
        That page does not exist, or it belongs to an account you cannot see.
      </p>
      <a href="/portal" className="mt-6 inline-block text-sm text-brand-green-dark hover:underline">
        Go back
      </a>
    </main>
  );
}
