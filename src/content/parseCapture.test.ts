import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCapture } from "./parseCapture.ts";

/**
 * The showcase parser is part of the product story (W3 §13.4): its output is
 * what a visitor reads on the homepage, so the deterministic cases are pinned
 * here rather than eyeballed in the browser.
 */

test("resolves the default Chinese demo sentence", () => {
  const outcome = parseCapture("周五交保险经济学 PPT", "cn");
  assert.equal(outcome.resolved, true);
  assert.equal(outcome.item.course, "保险经济学");
  assert.equal(outcome.item.time, "周五");
  assert.equal(outcome.item.content, "PPT");
  assert.equal(outcome.item.title, "周五交 PPT");
});

test("resolves a secondary Chinese example", () => {
  const outcome = parseCapture("明天数理统计记得带电脑", "cn");
  assert.equal(outcome.resolved, true);
  assert.equal(outcome.item.course, "数理统计");
  assert.equal(outcome.item.time, "明天");
  assert.equal(outcome.item.title, "明天带电脑");
});

test("recognises the longer course name instead of a shorter prefix", () => {
  const outcome = parseCapture("AI 职业与保险下周看第四章", "cn");
  assert.equal(outcome.item.course, "AI 职业与保险");
  assert.equal(outcome.item.time, "下周");
});

test("asks for confirmation when the sentence names no course", () => {
  const outcome = parseCapture("周五交作业", "cn");
  assert.equal(outcome.resolved, false);
  assert.equal(outcome.item.course, "");
  assert.equal(outcome.item.time, "周五");
});

test("asks for confirmation when there is no usable meaning at all", () => {
  const outcome = parseCapture("保险经济学", "cn");
  assert.equal(outcome.resolved, false);
  assert.equal(outcome.item.course, "保险经济学");
});

test("resolves the English demo sentence", () => {
  const outcome = parseCapture("Hand in the insurance economics PPT on Friday", "en");
  assert.equal(outcome.resolved, true);
  assert.equal(outcome.item.course, "insurance economics");
  assert.equal(outcome.item.time, "Friday");
  assert.equal(outcome.item.content, "PPT");
  assert.equal(outcome.item.title, "Hand in the PPT on Friday");
});

test("resolves an English sentence without a hand-in verb", () => {
  const outcome = parseCapture("Bring my laptop to mathematical statistics tomorrow", "en");
  assert.equal(outcome.resolved, true);
  assert.equal(outcome.item.course, "mathematical statistics");
  assert.equal(outcome.item.time, "tomorrow");
});

test("keeps the raw sentence available when nothing can be placed", () => {
  const outcome = parseCapture("read chapter 4", "en");
  assert.equal(outcome.resolved, false);
  assert.equal(outcome.item.title, "Read chapter 4");
});
