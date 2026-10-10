import { DragDropProvider } from "@dnd-kit/react";
import { type ComponentProps, useRef, useState } from "react";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Status } from "../../types/board.types";
import BoardColumn from "../board/BoardColumn";
import WorkItemForm from "../work-items/WorkItemForm";
import WorkItemsTable from "../work-items/WorkItemsTable";

const Board = () => {
  const selectedRepo = useSelectedRepoStore((s) => s.repo);
  const updateItemStatus = useWorkItemBoardStore((s) => s.updateItemStatus);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const closeDialog = () => {
    dialogRef.current?.close();
    setIsFormOpen(false);
  };
  const [backlogView, setBacklogView] = useState<boolean>(false);

  // TODO: Add a warning modal/callout for displaying errors (decision model approach using enums to resolve messages for a common callout component?)
  // repoPath falls back to "" (never a real repo path) rather than branching to a
  // literal [] here — that literal would be a new array every render, and since
  // useWorkItemBoardStore is a plain store (no shallow-compare selector), that's
  // seen as a changed snapshot on every render, causing an infinite update loop.
  const items = useWorkItemBoardStore((s) =>
    s.getItems(selectedRepo?.path ?? ""),
  );
  if (!selectedRepo) return null;

  /**
   * Handle the drag end event from the DragDropProvider.
   * This function updates the status of a work item when
   * it is dragged and dropped into a different column.
   * @param event The drag end event containing information about the source
   * and target of the drag operation.
   */
  const handleDragEnd: ComponentProps<typeof DragDropProvider>["onDragEnd"] = (
    event,
  ) => {
    if (event.canceled) return;
    const { source, target } = event.operation;
    if (!source || !target) return; // dropped outside any droppable

    const itemId = String(source.id);
    const destination = target.id; // the column's id, per BoardColumn's useDroppable({ id: columnStatus })
    if (!Object.values(Status).includes(destination as Status)) return;

    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === destination) return; // same-column drop is a no-op

    updateItemStatus(selectedRepo.path, itemId, destination as Status);
  };

  return (
    <section className="flex w-full grow flex-col gap-4 rounded-lg bg-gray-900 p-4 text-white">
      <section className="flex flex-col items-center justify-between gap-4">
        <h1 className="text-xl tracking-widest uppercase">Tasks</h1>
        <button
          className="btn-primary self-end"
          onClick={() => {
            setIsFormOpen(true);
            dialogRef.current?.showModal();
          }}
        >
          Add Item
        </button>
      </section>

      <div className="flex flex-col transition-all duration-300">
        <div className="flex w-fit">
          <button
            type="button"
            id="board-tab"
            className={`min-w-32 rounded-t-lg px-4 py-2 text-xl tracking-tight uppercase ${!backlogView ? "shadow-card-elevation-1 bg-gray-800" : "bg-gray-800/40"}`}
            onClick={() => setBacklogView(false)}
          >
            Board
          </button>
          <button
            type="button"
            id="backlog-tab"
            className={`min-w-32 rounded-t-lg border-transparent px-4 py-2 text-xl tracking-tight uppercase ${backlogView ? "shadow-card-elevation-1 bg-gray-800" : "bg-gray-800/40"}`}
            onClick={() => setBacklogView(true)}
          >
            Backlog
          </button>
        </div>
        <section className="rounded-b-lg bg-gray-800 p-6">
          {!backlogView && (
            <DragDropProvider onDragEnd={handleDragEnd}>
              <div
                id="board-view"
                className="flex min-h-32 w-full justify-between gap-4"
              >
                {Object.values(Status).map((status) => (
                  <BoardColumn
                    key={status}
                    columnStatus={status}
                    workItems={items.filter((item) => item.status === status)}
                  />
                ))}
              </div>
            </DragDropProvider>
          )}

          {backlogView && (
            <div
              id="backlog-view"
              className="shadow-card-elevation-2 flex flex-col rounded-lg"
            >
              {items.length ? (
                <WorkItemsTable />
              ) : (
                <span className="flex w-full justify-center rounded-lg bg-black p-4 text-sm text-gray-600">
                  No items
                </span>
              )}
            </div>
          )}
        </section>
      </div>

      <dialog
        ref={dialogRef}
        onCancel={closeDialog}
        className="m-auto rounded-lg bg-gray-900 p-6 text-white backdrop:bg-black/80"
      >
        {isFormOpen && <WorkItemForm onClose={closeDialog} />}
      </dialog>
    </section>
  );
};

export default Board;
