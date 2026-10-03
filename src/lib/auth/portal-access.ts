/** Presentation routing only. The API checks the signed session and current assignment. */
export function managerPathAllowed(path: string): boolean {
  return (
    /^\/portal\/manager(?:\/|$)/.test(path) ||
    /^\/portal\/analytics\/(?:overview|sales|products|inventory|tax)(?:\/|$)/.test(
      path,
    ) ||
    path === "/portal/analytics/export"
  );
}
