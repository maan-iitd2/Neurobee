import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f6b50 0%, #5faf8f 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "120px",
            height: "120px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.3)",
          }}
        >
          <span
            style={{
              fontSize: "52px",
              fontWeight: 900,
              color: "white",
              fontFamily: "sans-serif",
              lineHeight: 1,
              letterSpacing: "-2px",
            }}
          >
            NB
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
