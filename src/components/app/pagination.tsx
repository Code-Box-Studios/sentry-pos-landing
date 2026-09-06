import Link from "next/link";

/** Links rather than buttons: a page of a list is a URL, and must survive a reload. */
export function Pagination({
  page,
  totalPages,
  baseHref,
  query = {},
}: {
  page: number;
  totalPages: number;
  baseHref: string;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, value);
    }
    params.set("page", String(target));
    return `${baseHref}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="text-brand-green-dark hover:underline">
          ← Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-steel">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={href(page + 1)} className="text-brand-green-dark hover:underline">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
