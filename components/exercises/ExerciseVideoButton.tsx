import type { ExerciseVideo } from "@/lib/fitness-types";
import { PlayIcon } from "@/components/ui/icons";

// A compact, premium pill that links out to an external YouTube demonstration
// video (Phase 3.22). Videos are never embedded — this is just an external
// link that opens in a new tab. Rendered only when an exercise has a verified
// `video`; callers should guard on that before mounting this component.
//
// `variant="overlay"` styles the pill for a dark backdrop (e.g. the fullscreen
// image viewer); the default variant matches the card surface (light/dark).
export function ExerciseVideoButton({
  video,
  variant = "default",
  className = "",
}: {
  video: ExerciseVideo;
  variant?: "default" | "overlay";
  className?: string;
}) {
  const overlay = variant === "overlay";

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`צפה בהדגמה ביוטיוב: ${video.title} (${video.channelName}) — נפתח בכרטיסייה חדשה`}
      className={[
        "tap inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2",
        overlay
          ? "bg-white/12 text-white hover:bg-white/20 focus-visible:ring-offset-black/40"
          : "border border-border-strong bg-surface text-foreground hover:bg-surface-2 focus-visible:ring-offset-[color:var(--background)]",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          overlay
            ? "bg-white text-black"
            : "brand-gradient text-[color:var(--accent-contrast)]",
        ].join(" ")}
      >
        <PlayIcon className="h-3 w-3" />
      </span>
      צפה בהדגמה
    </a>
  );
}
