import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkItemBoardStore } from "./workItemBoardStore";
import { Status, TaskStatus, WorkItemtype } from "../types/board.types";
import type { Task, WorkItem } from "../types/board.types";

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

vi.stubGlobal("localStorage", createLocalStorageMock());

const REPO_A = "/repos/git-grove";
const REPO_B = "/repos/side-project";

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  title: "Write tests",
  description: "",
  status: TaskStatus.New,
  ...overrides,
});

const makeItem = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: "item-1",
  type: WorkItemtype.Story,
  title: "Add store tests",
  description: "",
  status: Status.New,
  tasks: [],
  ...overrides,
});

beforeEach(() => {
  useWorkItemBoardStore.setState({ boards: {} });
  localStorage.clear();
});

describe("useWorkItemBoardStore", () => {
  it("getItems returns the same empty array reference for an unknown repo", () => {
    const { getItems } = useWorkItemBoardStore.getState();
    const first = getItems(REPO_A);
    const second = getItems(REPO_A);

    expect(first).toEqual([]);
    expect(first).toBe(second); // referential stability — guards the infinite-loop bug the EMPTY_ITEMS comment warns about
  });

  it("addItem appends to the given repo without touching other repos", () => {
    const { addItem, getItems } = useWorkItemBoardStore.getState();
    const itemA = makeItem({ id: "a1" });
    const itemB = makeItem({ id: "b1" });

    addItem(REPO_A, itemA);
    addItem(REPO_B, itemB);

    expect(getItems(REPO_A)).toEqual([itemA]);
    expect(getItems(REPO_B)).toEqual([itemB]);
  });

  it("updateItem merges updates into the matching item only", () => {
    const { addItem, updateItem, getItems } = useWorkItemBoardStore.getState();
    addItem(REPO_A, makeItem({ id: "a1", title: "Original" }));
    addItem(REPO_A, makeItem({ id: "a2", title: "Untouched" }));

    updateItem(REPO_A, "a1", { title: "Renamed", status: Status.InProgress });

    const items = getItems(REPO_A);
    expect(items.find((i) => i.id === "a1")).toMatchObject({
      title: "Renamed",
      status: Status.InProgress,
    });
    expect(items.find((i) => i.id === "a2")?.title).toBe("Untouched");
  });

  it("updateItemStatus sets the new status and moves the item to the end of the repo's list", () => {
    const { addItem, updateItemStatus, getItems } =
      useWorkItemBoardStore.getState();
    addItem(REPO_A, makeItem({ id: "a1", status: Status.New }));
    addItem(REPO_A, makeItem({ id: "a2", status: Status.InProgress }));
    addItem(REPO_A, makeItem({ id: "a3", status: Status.New }));

    updateItemStatus(REPO_A, "a1", Status.InProgress);

    const items = getItems(REPO_A);
    expect(items.map((i) => i.id)).toEqual(["a2", "a3", "a1"]);
    expect(items.find((i) => i.id === "a1")?.status).toBe(Status.InProgress);
  });

  it("updateItemStatus lands the item below existing items of the destination status", () => {
    const { addItem, updateItemStatus, getItems } =
      useWorkItemBoardStore.getState();
    addItem(REPO_A, makeItem({ id: "n1", status: Status.New }));
    addItem(REPO_A, makeItem({ id: "d1", status: Status.Done }));
    addItem(REPO_A, makeItem({ id: "d2", status: Status.Done }));

    updateItemStatus(REPO_A, "n1", Status.Done);

    const doneIds = getItems(REPO_A)
      .filter((i) => i.status === Status.Done)
      .map((i) => i.id);
    expect(doneIds).toEqual(["d1", "d2", "n1"]);
  });

  it("updateItemStatus preserves every other field and the relative order of other items", () => {
    const { addItem, updateItemStatus, getItems } =
      useWorkItemBoardStore.getState();
    const task = makeTask({ id: "t1" });
    addItem(
      REPO_A,
      makeItem({
        id: "a1",
        title: "Keep me",
        description: "desc",
        tasks: [task],
      }),
    );
    addItem(REPO_A, makeItem({ id: "a2" }));
    addItem(REPO_A, makeItem({ id: "a3" }));

    updateItemStatus(REPO_A, "a1", Status.Done);

    const items = getItems(REPO_A);
    expect(items.map((i) => i.id)).toEqual(["a2", "a3", "a1"]);
    expect(items[2]).toMatchObject({
      title: "Keep me",
      description: "desc",
      tasks: [task],
      status: Status.Done,
    });
  });

  it("updateItemStatus does not touch other repos", () => {
    const { addItem, updateItemStatus, getItems } =
      useWorkItemBoardStore.getState();
    addItem(REPO_A, makeItem({ id: "a1" }));
    addItem(REPO_B, makeItem({ id: "b1" }));
    addItem(REPO_B, makeItem({ id: "b2" }));
    const before = getItems(REPO_B);

    updateItemStatus(REPO_A, "a1", Status.Done);

    expect(getItems(REPO_B)).toBe(before);
  });

  it("updateItemStatus is a no-op for an unknown id or a repo with no board", () => {
    const { addItem, updateItemStatus, getItems } =
      useWorkItemBoardStore.getState();
    addItem(REPO_A, makeItem({ id: "a1" }));
    const before = getItems(REPO_A);

    updateItemStatus(REPO_A, "missing", Status.Done);
    updateItemStatus("/repos/unknown", "a1", Status.Done);

    expect(getItems(REPO_A)).toBe(before);
    expect(getItems("/repos/unknown")).toEqual([]);
  });

  it("deleteItem removes only the matching item", () => {
    const { addItem, deleteItem, getItems } = useWorkItemBoardStore.getState();
    addItem(REPO_A, makeItem({ id: "a1" }));
    addItem(REPO_A, makeItem({ id: "a2" }));

    deleteItem(REPO_A, "a1");

    expect(getItems(REPO_A).map((i) => i.id)).toEqual(["a2"]);
  });

  it("addTask appends a task to the matching work item only", () => {
    const { addItem, addTask, getItems } = useWorkItemBoardStore.getState();
    addItem(REPO_A, makeItem({ id: "a1", tasks: [] }));
    addItem(REPO_A, makeItem({ id: "a2", tasks: [] }));

    addTask(REPO_A, "a1", makeTask({ id: "t1" }));

    const items = getItems(REPO_A);
    expect(items.find((i) => i.id === "a1")?.tasks).toEqual([
      makeTask({ id: "t1" }),
    ]);
    expect(items.find((i) => i.id === "a2")?.tasks).toEqual([]);
  });

  it("updateTask merges updates into the matching task, leaving sibling tasks and items untouched", () => {
    const { addItem, updateTask, getItems } = useWorkItemBoardStore.getState();
    addItem(
      REPO_A,
      makeItem({
        id: "a1",
        tasks: [makeTask({ id: "t1" }), makeTask({ id: "t2" })],
      }),
    );
    addItem(REPO_A, makeItem({ id: "a2", tasks: [makeTask({ id: "t3" })] }));

    updateTask(REPO_A, "a1", "t1", { status: TaskStatus.Completed });

    const items = getItems(REPO_A);
    const a1 = items.find((i) => i.id === "a1");
    const a2 = items.find((i) => i.id === "a2");

    expect(a1?.tasks.find((t) => t.id === "t1")).toMatchObject({
      status: TaskStatus.Completed,
    });
    expect(a1?.tasks.find((t) => t.id === "t2")?.status).toBe(TaskStatus.New);
    expect(a2?.tasks).toEqual([makeTask({ id: "t3" })]);
  });

  it("deleteTask removes only the matching task, leaving sibling tasks and items untouched", () => {
    const { addItem, deleteTask, getItems } = useWorkItemBoardStore.getState();
    addItem(
      REPO_A,
      makeItem({
        id: "a1",
        tasks: [makeTask({ id: "t1" }), makeTask({ id: "t2" })],
      }),
    );
    addItem(REPO_A, makeItem({ id: "a2", tasks: [makeTask({ id: "t3" })] }));

    deleteTask(REPO_A, "a1", "t1");

    const items = getItems(REPO_A);
    expect(items.find((i) => i.id === "a1")?.tasks.map((t) => t.id)).toEqual([
      "t2",
    ]);
    expect(items.find((i) => i.id === "a2")?.tasks).toEqual([
      makeTask({ id: "t3" }),
    ]);
  });

  it("updateItem, deleteItem, addTask, updateTask, and deleteTask are no-ops on a repo with no boards yet", () => {
    // Each action gets its own never-touched repoPath — reusing one would let an
    // earlier action's `?? []` fallback create the `boards[repoPath] = []` entry,
    // masking the fallback branch for every action that runs after it.
    const {
      updateItem,
      deleteItem,
      addTask,
      updateTask,
      deleteTask,
      getItems,
    } = useWorkItemBoardStore.getState();

    expect(() => {
      updateItem("/repos/never-added-1", "missing", { title: "x" });
      deleteItem("/repos/never-added-2", "missing");
      addTask("/repos/never-added-3", "missing", makeTask());
      updateTask("/repos/never-added-4", "missing", "missing", { title: "x" });
      deleteTask("/repos/never-added-5", "missing", "missing");
    }).not.toThrow();

    expect(getItems("/repos/never-added-1")).toEqual([]);
    expect(getItems("/repos/never-added-2")).toEqual([]);
    expect(getItems("/repos/never-added-3")).toEqual([]);
    expect(getItems("/repos/never-added-4")).toEqual([]);
    expect(getItems("/repos/never-added-5")).toEqual([]);
  });
});
