import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useClickOutside } from "./useClickOutside";

function firePointerDown(target: Element) {
  target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
}

describe("useClickOutside", () => {
  let container: HTMLDivElement;
  let inside: HTMLDivElement;
  let outside: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    inside = document.createElement("div");
    container.appendChild(inside);
    outside = document.createElement("div");
    document.body.appendChild(container);
    document.body.appendChild(outside);
  });

  afterEach(() => {
    container.remove();
    outside.remove();
  });

  it("calls the callback when a pointerdown happens outside the ref'd element", () => {
    const onClickOutside = vi.fn();
    renderHook(() =>
      useClickOutside({ current: container }, onClickOutside),
    );

    firePointerDown(outside);

    expect(onClickOutside).toHaveBeenCalledTimes(1);
  });

  it("does not call the callback for a pointerdown inside the ref'd element (including descendants)", () => {
    const onClickOutside = vi.fn();
    renderHook(() =>
      useClickOutside({ current: container }, onClickOutside),
    );

    firePointerDown(inside);

    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("does nothing while enabled is false", () => {
    const onClickOutside = vi.fn();
    renderHook(() =>
      useClickOutside({ current: container }, onClickOutside, false),
    );

    firePointerDown(outside);

    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("stops listening once unmounted", () => {
    const onClickOutside = vi.fn();
    const { unmount } = renderHook(() =>
      useClickOutside({ current: container }, onClickOutside),
    );

    unmount();
    firePointerDown(outside);

    expect(onClickOutside).not.toHaveBeenCalled();
  });
});
