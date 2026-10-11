/**
 * Local, deterministic capture parsing for the website demo (W3 §12.6, §13).
 *
 * This is a demo-only stand-in for the real product's deterministic first pass.
 * It never calls an API, never calls a model, and is deliberately small: the
 * point of the showcase is the *order* of the real behaviour —
 *
 *   记下 → 理解 → 确认 → 归位
 *
 * not "input → AI magic → perfect task". When an answer is not derivable from
 * the sentence itself, the demo says so and asks one small question instead of
 * inventing one (W0 §16.2, W3 §13.4).
 */

export type ParserLocale = "cn" | "en";

export interface ParsedCapture {
  course: string;
  /** Day phrase as the sentence wrote it, e.g. 周五 / Friday. */
  time: string;
  /** Deliverable kind, e.g. PPT / 作业 / essay. */
  content: string;
  /** The sentence with the course removed — how a person would retell it. */
  title: string;
}

export interface ParseOutcome {
  /** false when the sentence gives no usable placement or meaning. */
  resolved: boolean;
  item: ParsedCapture;
}

const CN_COURSES = ["高等数学", "数理统计", "文学赏析"] as const;

const EN_COURSES = [
  "advanced mathematics",
  "mathematical statistics",
  "literature appreciation",
] as const;

const CN_DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const;
const CN_RELATIVE = ["今天", "明天", "后天", "下周", "本周", "这周"] as const;
const CN_DELIVERABLES = ["PPT", "第二次作业", "作业", "论文", "报告", "实验", "预习", "复习", "展示"] as const;

const EN_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
const EN_RELATIVE = ["today", "tomorrow", "next week", "this week"] as const;
const EN_DELIVERABLES = [
  "ppt",
  "slides",
  "presentation",
  "assignment",
  "essay",
  "report",
  "lab report",
  "reading",
  "homework",
  "problem set",
] as const;

const CN_SOFTENERS = /(记得|需要)/g;
const EN_SOFTENERS = /\b(remember to|remember|need to|needs to|must|please|don't forget to|do not forget to)\b[,:]?/gi;
const PARTICLE_EDGES = /^[\s，。、；：,.;:!！?？]+|[\s，。、；：,.;:!！?？]+$/g;
const CJK_SPACE = /(?<=[\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g;

function firstMatch(haystack: string, needles: readonly string[]): string | null {
  let best: string | null = null;
  for (const needle of needles) {
    if (!haystack.toLowerCase().includes(needle.toLowerCase())) continue;
    if (best === null || needle.length > best.length) best = needle;
  }
  return best;
}

/** Removes one token occurrence without disturbing the rest of the sentence. */
function stripToken(source: string, token: string): string {
  const index = source.toLowerCase().indexOf(token.toLowerCase());
  if (index === -1) return source;
  return `${source.slice(0, index)} ${source.slice(index + token.length)}`
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Tidies a remainder for display. It only removes what carries no meaning —
 * softeners, articles and stray punctuation. Words like 交 / 带 / 看 stay:
 * "明天记得带讲义资料" should read "明天带讲义资料", not "明天 讲义资料".
 */
function tidy(text: string, locale: ParserLocale): string {
  const collapsed = text.replace(/\s{2,}/g, " ").trim();
  const withoutSofteners =
    locale === "cn"
      ? collapsed.replace(CJK_SPACE, "").replace(CN_SOFTENERS, "")
      : collapsed.replace(EN_SOFTENERS, " ");
  const trimmed = withoutSofteners
    .replace(/\s{2,}/g, " ")
    .replace(PARTICLE_EDGES, "")
    .trim();
  if (locale === "en") return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return trimmed.replace(CJK_SPACE, "");
}

function extractCourse(
  source: string,
  courses: readonly string[],
): { course: string; rest: string } {
  const course = firstMatch(source, courses);
  if (!course) return { course: "", rest: source };
  // Display the course name with its original casing from the sentence.
  const index = source.toLowerCase().indexOf(course.toLowerCase());
  const written = source.slice(index, index + course.length);
  return { course: written, rest: stripToken(source, course) };
}

function extractTime(
  source: string,
  locale: ParserLocale,
): { time: string; rest: string } {
  if (locale === "cn") {
    const absolute = source.match(/\d{1,2}\s*月\s*\d{1,2}\s*[日号]/);
    if (absolute) {
      return {
        time: absolute[0].replace(/\s+/g, ""),
        rest: stripToken(source, absolute[0]),
      };
    }
    const weekday = firstMatch(source, CN_DAYS);
    if (weekday) return { time: weekday, rest: stripToken(source, weekday) };
    const numbered = source.match(/周([一二三四五六日天])/);
    if (numbered) {
      const time = `周${numbered[1] === "天" ? "日" : numbered[1]}`;
      return { time, rest: stripToken(source, numbered[0]) };
    }
    const relative = firstMatch(source, CN_RELATIVE);
    if (relative) return { time: relative, rest: stripToken(source, relative) };
    return { time: "", rest: source };
  }

  const absolute = source.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b/i,
  );
  if (absolute) {
    return { time: absolute[0].trim(), rest: stripToken(source, absolute[0]) };
  }
  const relative = firstMatch(source, EN_RELATIVE);
  if (relative) {
    const index = source.toLowerCase().indexOf(relative);
    const written = source.slice(index, index + relative.length);
    return { time: written, rest: stripToken(source, relative) };
  }
  const weekday = firstMatch(source, EN_DAYS);
  if (weekday) {
    const index = source.toLowerCase().indexOf(weekday);
    const written = source.slice(index, index + weekday.length);
    return { time: written, rest: stripToken(source, weekday) };
  }
  return { time: "", rest: source };
}

function extractContent(
  source: string,
  locale: ParserLocale,
): { content: string; rest: string } {
  if (locale === "cn") {
    const word = firstMatch(source, CN_DELIVERABLES);
    if (!word) return { content: "", rest: source };
    return { content: word, rest: stripToken(source, word) };
  }
  const word = firstMatch(source, EN_DELIVERABLES);
  if (!word) return { content: "", rest: source };
  const index = source.toLowerCase().indexOf(word.toLowerCase());
  const written = source.slice(index, index + word.length);
  const normalised = written.toLowerCase() === "ppt" ? "PPT" : written;
  return { content: normalised, rest: stripToken(source, word) };
}

/**
 * Parses one captured sentence against the demo courses of the active language.
 * The raw input is never discarded — the caller keeps it on screen, because the
 * real product preserves the original capture before interpreting it.
 */
export function parseCapture(rawInput: string, locale: ParserLocale = "cn"): ParseOutcome {
  const raw = rawInput.trim();
  const courses = locale === "cn" ? CN_COURSES : EN_COURSES;

  const courseStep = extractCourse(raw, courses);
  const timeStep = extractTime(courseStep.rest, locale);
  const contentStep = extractContent(timeStep.rest, locale);

  /**
   * The item title keeps the visitor's own phrasing whenever the sentence still
   * says something after the course is removed ("明天带讲义资料" stays
   * "明天带讲义资料"). It is only rebuilt — "周五交作业" — when the remainder is
   * nothing but a time word, which would otherwise read as a fragment.
   *
   * The deliverable word (PPT, 作业) stays inside the title; the interface shows
   * 课程 / 时间 / 内容 as separate fields, so the title is never asked to carry
   * the structure on its own.
   */
  const remaining = tidy(courseStep.rest, locale);
  const composed = [timeStep.time ? `${timeStep.time}交` : "", contentStep.content]
    .filter(Boolean)
    .join(" ")
    .trim();

  const canCompose = Boolean(timeStep.time) && Boolean(contentStep.content);
  const remainingIsTimeOnly = isTimeOnly(remaining, timeStep.time, locale);

  const resolved = Boolean(courseStep.course) && Boolean(timeStep.time || contentStep.content);

  return {
    resolved,
    item: {
      course: courseStep.course,
      time: timeStep.time,
      content: contentStep.content,
      title: canCompose && remainingIsTimeOnly ? composed : remaining || raw,
    },
  };
}

/** True when nothing but the day phrase is left, with or without a linker. */
function isTimeOnly(value: string, time: string, locale: ParserLocale): boolean {
  if (!time) return false;
  const encoded = value.split(time).join("").trim();
  if (!encoded) return true;
  return locale === "cn" ? /^[交的]+$/.test(encoded) : /^(on|for|by|the|due)$/i.test(encoded);
}

/** Kept for the demo dataset: the courses Scene 02 can recognise. */
export const DEMO_COURSES = CN_COURSES;

/**
 * The catalogued reading of the showcase's own demo sentence, used as the
 * scenario constant for Scene 03 / Scene 04 (W4 §2). It goes through exactly
 * the same deterministic parser a visitor's typed input goes through, so the
 * scenario can never drift from what the Scene 02 demo actually shows.
 */
export function parseCaptureFields(
  rawInput: string,
  locale: ParserLocale,
): { course: string; time: string; content: string; title: string } {
  const { item } = parseCapture(rawInput, locale);
  return {
    course: item.course,
    time: item.time,
    content: item.content || item.title,
    title: item.title,
  };
}
