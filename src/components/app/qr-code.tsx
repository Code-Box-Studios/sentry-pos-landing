import { toString as qrToString } from "qrcode";

/**
 * Renders the otpauth URI as an inline SVG on the server. Doing it server-side keeps the
 * secret out of the client bundle and off the network as an image request.
 */
export async function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const svg = await qrToString(value, { type: "svg", margin: 1, width: size });
  return (
    <div
      aria-hidden="true"
      className="inline-block rounded-lg border border-hairline bg-white p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
