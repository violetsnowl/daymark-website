import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCapture } from "./parseCapture.ts";

/**
 * The showcase parser is part of the product story (W3 §13.4): its output is
 * what a visitor reads on the homepage, so the deterministic cases are pinned
 * here rather than eyeballed in the browser.
 */

test("resolves the default Chinese demo sentence", () => {
  const outcome = parseCapture("周五交高等数学第二次作业", "cn");
  assert.equal(outcome.resolved, true);
  assert.equal(outcome.item.course, "高等数学");
  assert.equal(outcome.item.time, "周五");
  assert.equal(outcome.item.content, "第二次作业");
  assert.equal(outcome.item.title, "周五交第二次作业");
});

test("resolves a secondary Chinese example", () => {
  const outcome = parseCapture("明天数理统计记得带讲义资料", "cn");
  assert.equal(outcome.resolved, true);
  assert.equal(outcome.item.course, "数理统计");
  assert.equal(outcome.item.time, "明天");
  assert.equal(outcome.item.title, "明天带讲义资料");
});

test("recognises the literature course in the sentence", () => {
  const outcome = parseCapture("文学赏析下周看第四章", "cn");
  assert.equal(outcome.item.course, "文学赏析");
  assert.equal(outcome.item.time, "下周");
});

test("asks for confirmation when the sentence names no course", () => {
  const outcome = parseCapture("周五交作业", "cn");
  assert.equal(outcome.resolved, false);
  assert.equal(outcome.item.course, "");
  assert.equal(outcome.item.time, "周五");
});

test("asks for confirmation when there is no usable meaning at all", () => {
  const outcome = parseCapture("高等数学", "cn");
  assert.equal(outcome.resolved, false);
  assert.equal(outcome.item.course, "高等数学");
});

test("resolves the English demo sentence", () => {
  const outcome = parseCapture(
    "Hand in the second advanced mathematics assignment on Friday",
    "en",
  );
  assert.equal(outcome.resolved, true);
  assert.equal(outcome.item.course, "advanced mathematics");
  assert.equal(outcome.item.time, "Friday");
  assert.equal(outcome.item.content, "assignment");
  assert.equal(outcome.item.title, "Hand in the second assignment on Friday");
});

test("resolves an English sentence without a hand-in verb", () => {
  const outcome = parseCapture("Bring the handout to mathematical statistics tomorrow", "en");
  assert.equal(outcome.resolved, true);
  assert.equal(outcome.item.course, "mathematical statistics");
  assert.equal(outcome.item.time, "tomorrow");
});

test("keeps the raw sentence available when nothing can be placed", () => {
  const outcome = parseCapture("read chapter 4", "en");
  assert.equal(outcome.resolved, false);
  assert.equal(outcome.item.title, "Read chapter 4");
});
