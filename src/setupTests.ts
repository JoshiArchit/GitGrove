import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);

// jsdom doesn't implement <dialog>'s showModal()/close() — several components
// (Board, TaskCard, WorkItemCard, WorkItemCardExpanded) rely on them to open
// and close modals, so tests need a minimal working stand-in.
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
};

// jsdom doesn't implement ResizeObserver either (RepoSummary uses one to keep
// its echarts canvas sized to its container). Tests don't need it to actually
// observe anything, just to not throw on construction.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
