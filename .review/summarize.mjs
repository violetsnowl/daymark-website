/** Summarises .review/measure.json into one line per viewport. */
import { readFileSync } from "node:fs";

const report = JSON.parse(
  readFileSync(new URL("./measure.json", import.meta.url), "utf8"),
);
const TARGETS = {
  ".hero": [500, 2000],
  ".hero-copy": [500, 2000],
  ".hero-title": [500, 1400],
  ".hero-stage": [500, 2000],
};

for (const [key, value] of Object.entries(report)) {
  const overflow = value.docScrollWidth > value.viewport.w ? "  *** H-OVERFLOW ***" : "";
  console.log(
    `== ${key}  viewport ${value.viewport.w}x${value.viewport.h}  doc ${value.docScrollWidth}x${value.docHeight}${overflow}`,
  );
  for (const element of value.elements) {
    console.log(
      `   ${element.selector.padEnd(22)} x=${String(element.x).padStart(5)} y=${String(element.y).padStart(5)} w=${String(element.w).padStart(5)} h=${String(element.h).padStart(5)}  fs=${element.fontSize}`,
    );
  }
  if (value.fragments.length) {
    console.log("   fragments:");
    for (const fragment of value.fragments) {
      console.log(
        `     "${fragment.text}" x=${fragment.x} y=${fragment.y} w=${fragment.w} fs=${fragment.fontSize} opacity=${fragment.opacity}`,
      );
    }
  }
  for (const [selector, [min, max]] of Object.entries(TARGETS)) {
    const element = value.elements.find((entry) => entry.selector === selector);
    if (!element) continue;
    const horizontal = element.x + element.w;
    if (horizontal > value.viewport.w + 1 || element.x < -1) {
      console.log(`   ! ${selector} exceeds the viewport horizontally (right=${horizontal})`);
    }
    if (element.h < min || element.h > max) {
      console.log(`   ! ${selector} height ${element.h} outside ${min}..${max}`);
    }
  }
}
