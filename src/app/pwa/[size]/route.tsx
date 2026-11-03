import { ImageResponse } from "next/og";

// PNG app icons for the manifest, drawn from code (same pulse mark as icon.svg) — no binary files in the repo.
const SIZES = ["192", "512"];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}
export const dynamicParams = false;

export async function GET(_request: Request, { params }: RouteContext<"/pwa/[size]">) {
  const px = Number((await params).size);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0b0f" }}>
        <svg width={px * 0.62} height={px * 0.62} viewBox="0 0 32 32">
          <path d="M5 17h5l3-7 5 13 3-6h6" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
