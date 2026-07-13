import { ImageResponse } from "next/og";

export const alt = "DoughTools complete pizza planning";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#FFF8F1", color: "#1F1F1F", padding: 70, fontFamily: "Arial, sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 700 }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}><span>Dough</span><span style={{ color: "#e34a2c" }}>Tools</span></div>
        <div style={{ display: "flex", marginTop: 55, fontSize: 68, lineHeight: 1.05, fontWeight: 800 }}>Better pizza starts before the oven.</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "rgba(24,34,27,.62)" }}>Recipe, shopping, timeline and kitchen guidance for your next pizza night.</div>
      </div>
      <div style={{ display: "flex", position: "absolute", right: -45, top: -50, width: 510, height: 510, borderRadius: "50%", background: "#e34a2c", alignItems: "center", justifyContent: "center", transform: "rotate(8deg)" }}>
        <div style={{ display: "flex", position: "relative", width: 365, height: 365, borderRadius: "50%", background: "#efc46d", border: "28px solid #d99b42" }}>
          {[[55, 55], [220, 45], [120, 190], [245, 230]].map(([left, top], index) => <div key={index} style={{ position: "absolute", left, top, width: 62, height: 62, borderRadius: "50%", background: "#bf3826" }} />)}
        </div>
      </div>
    </div>,
    size,
  );
}
