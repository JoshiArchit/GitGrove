import { beforeEach, describe, expect, it } from "vitest";
import { useAppViewStore } from "./appViewStore";

const initialState = useAppViewStore.getState();

beforeEach(() => {
  useAppViewStore.setState(initialState, true);
});

describe("useAppViewStore", () => {
  it("starts with settings hidden", () => {
    expect(useAppViewStore.getState().showSettings).toBe(false);
  });

  it("openSettings shows settings", () => {
    useAppViewStore.getState().openSettings();

    expect(useAppViewStore.getState().showSettings).toBe(true);
  });

  it("closeSettings hides settings", () => {
    useAppViewStore.setState({ showSettings: true });

    useAppViewStore.getState().closeSettings();

    expect(useAppViewStore.getState().showSettings).toBe(false);
  });

  it("closeSettings is a no-op when already hidden", () => {
    useAppViewStore.getState().closeSettings();

    expect(useAppViewStore.getState().showSettings).toBe(false);
  });
});
