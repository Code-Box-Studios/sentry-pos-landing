import { ImageResponse } from "next/og";
export const alt = "Sentry — POS and business monitoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#001e2b", padding: 80, color: "white" }}>
    <div style={{ color: "#00ed64", fontSize: 36, marginBottom: 36 }}>Sentry</div>
    <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 600 }}><span>Your business,</span><span>always in sight.</span></div>
    <div style={{ fontSize: 26, marginTop: 36, color: "#b8cbd1" }}>POS and business monitoring for Philippine businesses</div>
  </div>, size);
}
