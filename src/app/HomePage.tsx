import { AiQuietlyScene } from "../components/scene/AiQuietlyScene.tsx";
import { CaptureScene } from "../components/scene/CaptureScene.tsx";
import { ClosingScene } from "../components/scene/ClosingScene.tsx";
import { ContextScene } from "../components/scene/ContextScene.tsx";
import { DayScene } from "../components/scene/DayScene.tsx";
import { HeroScene } from "../components/scene/HeroScene.tsx";
import { ReminderScene } from "../components/scene/ReminderScene.tsx";
import { SmallThingsScene } from "../components/scene/SmallThingsScene.tsx";
import { SyncScene } from "../components/scene/SyncScene.tsx";
import { ViewsScene } from "../components/scene/ViewsScene.tsx";
import { SiteFooter } from "../components/site/SiteFooter.tsx";

/**
 * The full homepage, in narrative order (W4 §1):
 *
 *   01 Hero  →  02 Small Things  →  03 Quick Capture
 *            →  04 Context       →  05 One Item, Many Views
 *            →  06 Reminder      →  07 AI, Quietly
 *            →  08 Offline / Sync →  09 A Day  →  10 Closing
 *
 * One continuous sentence: a small thing is recorded, it gains where it belongs, it
 * is seen from three places, time brings it back, one unclear detail gets resolved,
 * the record stays continuous across devices, and the day it belongs to ends with
 * everything in its place.
 */
export function HomePage() {
  return (
    <>
      <main id="main">
        <HeroScene />
        <SmallThingsScene />
        <CaptureScene />
        <ContextScene />
        <ViewsScene />
        <ReminderScene />
        <AiQuietlyScene />
        <SyncScene />
        <DayScene />
        <ClosingScene />
      </main>
      <SiteFooter />
    </>
  );
}
