import type { BoardMark } from "@/lib/types";

export const ink = "#293b32";
export const green = "#3b805c";
export const blue = "#507aaf";
export const orange = "#bc7948";
export const purple = "#8a6a9e";
export const mint = "#e9f4e8";

export const txt = (
  x: number,
  y: number,
  text: string,
  size = 28,
  color = ink,
  weight = 550,
  textAnchor?: "start" | "middle" | "end"
): BoardMark => ({
  type: "text",
  x,
  y,
  text,
  size,
  color,
  weight,
  ...(textAnchor ? { textAnchor } : {}),
});

export const line = (
  d: string,
  color = green,
  strokeWidth = 2.5,
  fill = "none",
  dashed = false
): BoardMark => ({
  type: "path",
  d,
  color,
  strokeWidth,
  fill,
  dashed,
});

export const box = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  color = green
): BoardMark => ({
  type: "rect",
  x,
  y,
  w,
  h,
  fill,
  color,
  strokeWidth: 2,
});

export const circle = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color = green,
  strokeWidth = 2.8,
  rotate = -3
): BoardMark => ({
  type: "ellipse",
  x: cx,
  y: cy,
  w: rx,
  h: ry,
  fill: "none",
  color,
  strokeWidth,
  rotate,
});

export const arrow = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = green
): BoardMark => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const t = (a: number) => Math.round(a * 10) / 10;
  return line(
    `M${x1} ${y1} L${x2} ${y2} M${t(x2 - 12 * Math.cos(angle - 0.46))} ${t(
      y2 - 12 * Math.sin(angle - 0.46)
    )} L${x2} ${y2} L${t(x2 - 12 * Math.cos(angle + 0.46))} ${t(
      y2 - 12 * Math.sin(angle + 0.46)
    )}`,
    color,
    2.8
  );
};

export const penHighlight = (
  x: number,
  y: number,
  width: number,
  value: string,
  size = 33,
  color = "#f7dc6f"
): BoardMark[] => {
  const strokeY = y + 25;
  return [
    {
      type: "path",
      d: `M${x + 8} ${strokeY} L${x + width - 8} ${strokeY}`,
      color,
      fill: "none",
      strokeWidth: 32,
      opacity: 0.35,
    },
    txt(x + 12, y + 34, value, size, "#1e3d29", 650),
  ];
};

export const head = (text: string, right = 420): BoardMark[] => [
  txt(52, 54, text, 40, ink, 650),
  line(`M54 67 Q${Math.round(right * 0.56)} 63 ${right} 66`, "#8bb299", 3.4),
];
