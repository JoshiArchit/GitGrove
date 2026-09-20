import { useEffect, type RefObject } from "react";

/**
 * Detects a pointer press starting outside of `ref`'s element and delegates
 * the response to the caller via `onClickOutside` — the hook only detects the
 * outside press; `onClickOutside` is the caller-supplied action that decides
 * what "outside" should actually do (close a menu, collapse a sidebar,
 * dismiss a popover, etc.).
 * Pass `enabled = false` to skip attaching the listener entirely (e.g. there's
 * nothing to "close" while the target is already closed).
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    // pointerdown (not click) fires before the target could be removed or
    // re-rendered by whatever the inside/outside click itself triggers,
    // making "was this press outside the element" reliable to check.
    function handlePointerDown(event: PointerEvent) {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      onClickOutside();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [ref, onClickOutside, enabled]);
}
