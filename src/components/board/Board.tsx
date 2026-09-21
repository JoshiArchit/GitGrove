import { useRef, useState } from "react";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Status } from "../../types/board.types";
import BoardColumn from "../board/BoardColumn";
import WorkItemForm from "../work-items/WorkItemForm";

const Board = () => {
  const selectedRepo = useSelectedRepoStore((s) => s.repo);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const closeDialog = () => {
    dialogRef.current?.close();
    setIsFormOpen(false);
  };

  // TODO: Add a warning modal/callout for displaying errors (decision model approach using enums to resolve messages for a common callout component?)
  // repoPath falls back to "" (never a real repo path) rather than branching to a
  // literal [] here — that literal would be a new array every render, and since
  // useWorkItemBoardStore is a plain store (no shallow-compare selector), that's
  // seen as a changed snapshot on every render, causing an infinite update loop.
  const items = useWorkItemBoardStore((s) =>
    s.getItems(selectedRepo?.path ?? ""),
  );
  if (!selectedRepo) return null;

  const newItems = items.filter((i) => i.status === Status.New);
  const inProgressItems = items.filter((i) => i.status === Status.InProgress);
  const doneItems = items.filter((i) => i.status === Status.Done);

  return (
    <section className="flex h-full w-full flex-col gap-4 rounded-lg bg-gray-900 p-4 text-white">
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

      <dialog
        ref={dialogRef}
        onCancel={closeDialog}
        className="m-auto rounded-lg bg-gray-900 p-6 text-white backdrop:backdrop:bg-gray-900/60"
      >
        {isFormOpen && <WorkItemForm onClose={closeDialog} />}
      </dialog>

      <section className="shadow-card-elevation-1 rounded-lg bg-gray-800 p-6">
        <div className="flex min-h-32 w-full justify-between gap-4">
          {" "}
          <BoardColumn columnStatus={Status.New} workItems={newItems} />
          <BoardColumn
            columnStatus={Status.InProgress}
            workItems={inProgressItems}
          />
          <BoardColumn columnStatus={Status.Done} workItems={doneItems} />
        </div>
      </section>
    </section>
  );
};

export default Board;
