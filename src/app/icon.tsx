import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "25%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {/* Honeycomb hex shape */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "220px",
              height: "220px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "50%",
              border: "6px solid rgba(255,255,255,0.3)",
            }}
          >
            <span
              style={{
                fontSize: "120px",
                fontWeight: 900,
                color: "white",
                fontFamily: "sans-serif",
                lineHeight: 1,
                letterSpacing: "-4px",
              }}
            >
              NB
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
