import assert from "node:assert/strict";
import { test } from "node:test";
import { showcase, showcaseStrings } from "./demo.ts";
import { parseCaptureFields } from "./parseCapture.ts";

/**
 * W4 §2 makes one item the narrative lead of the whole homepage: the sentence
 * Scene 02 types, the object Scene 03 gives context to, and the thing Scene 04
 * re-sees from three places must all be the same object. These tests pin that
 * continuity so a copy edit cannot quietly break the story.
 */

for (const locale of ["cn", "en"] as const) {
  const demo = showcase[locale];
  const strings = showcaseStrings[locale];

  test(`[${locale}] the showcase scenario matches what the demo parser produces`, () => {
    const parsed = parseCaptureFields(demo.sourceCapture.raw, locale);
    assert.deepEqual(
      { course: parsed.course, time: parsed.time, content: parsed.content },
      demo.sourceCapture.fields,
    );
    assert.equal(parsed.title, demo.sourceCapture.title);
  });

  test(`[${locale}] Scene 02 and Scene 03 show the same item title`, () => {
    assert.equal(demo.sourceCapture.title, demo.mainItem.title);
  });

  test(`[${locale}] the main item belongs to the first course in the overview`, () => {
    assert.equal(demo.heroItems[0].title, demo.mainItem.title);
    assert.equal(demo.heroItems[0].course, demo.mainItem.course);
  });

  test(`[${locale}] the item carries the four pieces of context Scene 03 reveals`, () => {
    assert.ok(demo.mainItem.course.length > 0, "course label present");
    assert.ok(demo.mainItem.time.length > 0, "time present");
    assert.ok(demo.mainItem.detail.length > 0, "content present");
    assert.ok(strings.capture.clarifyQuestion.length > 0, "reminder copy present");
  });

  test(`[${locale}] the course projection lists the same course as the item`, () => {
    assert.ok(demo.secondaryItems.length > 0);
    for (const item of demo.secondaryItems) {
      assert.equal(item.course, demo.mainItem.course);
    }
  });

  test(`[${locale}] the calendar projection has a real hour column for the item`, () => {
    assert.ok(demo.calendar.hours.length > 1);
    assert.ok(demo.calendar.activeHourIndex >= 0);
    assert.ok(demo.calendar.activeHourIndex < demo.calendar.hours.length);
    assert.equal(demo.calendar.days.filter((day) => day.active).length, 1);
    assert.equal(demo.calendar.caption, demo.mainItem.time);
  });
}
