import { redirect } from "next/navigation";

/** Task 9 replaces this with the dashboard (analytics-spec §0). */
export default function PortalHomePage() {
  redirect("/portal/businesses");
}
