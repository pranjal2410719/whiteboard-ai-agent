import type { BoardMark } from "../types";

export const palette = {
  ink: "#293b32",
  inkMuted: "#47594f",
  green: "#3b805c",
  greenLight: "#eaf4e9",
  greenBorder: "#8bb299",
  blue: "#507aaf",
  blueLight: "#eef4fb",
  blueBorder: "#8ba7cb",
  orange: "#bc7948",
  orangeLight: "#fbf3ea",
  orangeBorder: "#d9a57e",
  purple: "#8a6a9e",
  purpleLight: "#f4edf8",
  purpleBorder: "#b9a1c8",
  gold: "#d4a017",
  goldLight: "#fff9e6",
  divider: "#cbd5cf",
  white: "#ffffff",
};

export function textMark(
  x: number,
  y: number,
  text: string,
  size = 26,
  color = palette.ink,
  weight = 550,
  align?: "start" | "middle" | "end"
): BoardMark {
  return {
    type: "text",
    x,
    y,
    text,
    size,
    color,
    weight,
    ...(align ? { textAnchor: align, align } : {}),
  };
}

export function pathMark(
  d: string,
  color = palette.green,
  strokeWidth = 2.5,
  fill = "none",
  dashed = false,
  opacity?: number
): BoardMark {
  return {
    type: "path",
    d,
    color,
    strokeWidth,
    fill,
    dashed,
    ...(opacity !== undefined ? { opacity } : {}),
  };
}

export function rectMark(
  x: number,
  y: number,
  w: number,
  h: number,
  fill = "none",
  color = palette.green,
  strokeWidth = 2
): BoardMark {
  return {
    type: "rect",
    x,
    y,
    w,
    h,
    fill,
    color,
    strokeWidth,
  };
}

export function cardBox(
  x: number,
  y: number,
  w: number,
  h: number,
  fill = palette.greenLight,
  stroke = palette.greenBorder,
  strokeWidth = 1.8
): BoardMark {
  return {
    type: "rect",
    x,
    y,
    w,
    h,
    fill,
    color: stroke,
    strokeWidth,
  };
}

export function circleMark(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color = palette.green,
  strokeWidth = 2.6,
  fill = "none",
  rotate = 0
): BoardMark {
  return {
    type: "ellipse",
    x: cx,
    y: cy,
    w: rx,
    h: ry,
    color,
    strokeWidth,
    fill,
    rotate,
  };
}

export function headerMark(
  text: string,
  underlineWidth = 400,
  x = 52,
  y = 48,
  accent = palette.greenBorder
): BoardMark[] {
  const underlineY = y + 13;
  return [
    textMark(x, y, text, 36, palette.ink, 650),
    pathMark(
      `M${x} ${underlineY} Q${Math.round(x + underlineWidth * 0.52)} ${underlineY - 4} ${x + underlineWidth} ${underlineY}`,
      accent,
      3.2
    ),
  ];
}

export function centeredHeaderMark(
  text: string,
  underlineWidth = 420,
  centerX = 500,
  y = 36,
  accent = palette.greenBorder
): BoardMark[] {
  const half = Math.round(underlineWidth / 2);
  const startX = centerX - half;
  const underlineY = y + 11;
  return [
    textMark(centerX, y, text, 34, palette.ink, 650, "middle"),
    pathMark(
      `M${startX} ${underlineY} Q${centerX} ${underlineY - 3} ${centerX + half} ${underlineY}`,
      accent,
      3.0
    ),
  ];
}

export function flowArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = palette.green,
  strokeWidth = 2.6
): BoardMark {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const t = (n: number) => Math.round(n * 10) / 10;
  const headLen = 10;
  return pathMark(
    `M${x1} ${y1} L${x2} ${y2} M${t(x2 - headLen * Math.cos(angle - 0.44))} ${t(
      y2 - headLen * Math.sin(angle - 0.44)
    )} L${x2} ${y2} L${t(x2 - headLen * Math.cos(angle + 0.44))} ${t(
      y2 - headLen * Math.sin(angle + 0.44)
    )}`,
    color,
    strokeWidth
  );
}

export function badgePill(
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  fill = palette.greenLight,
  stroke = palette.greenBorder,
  textColor = palette.ink,
  textSize = 17
): BoardMark[] {
  return [
    rectMark(x, y, w, h, fill, stroke, 1.5),
    textMark(Math.round(x + w / 2), Math.round(y + h * 0.72), text, textSize, textColor, 600, "middle"),
  ];
}
