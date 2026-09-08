import { toPolyline } from "@/lib/charts/geometry";

const BOX = { width: 120, height: 32 };

/**
 * A tiny trend with no axes — the shape of the week, not its numbers.
 *
 * A Server Component on purpose: it renders inside the request that fetched the
 * data, adds nothing to the bundle, and needs no charting dependency.
 */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const points = toPolyline(values, BOX);

  return (
    <svg
      viewBox={`0 0 ${BOX.width} ${BOX.height}`}
      className="h-8 w-full text-brand-green-dark"
      role="img"
      preserveAspectRatio="none"
    >
      <title>{label}</title>
      {points === "" ? null : (
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
