import { useRef, useState } from "react";
import { useWorkItemBoardStore } from "../../store/workItemBoardStore";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { Status } from "../../types/board.types";
import BoardColumn from "./BoardColumn";
import WorkItemForm from "./WorkItemForm";

const Board = () => {
  const selectedRepo = useSelectedRepoStore((s) => s.repo);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const closeDialog = () => {
    dialogRef.current?.close();
    setIsFormOpen(false);
  };

  // TODO: Add a warning modal/callout for displaying errors (decision model approach using enums to resolve messages for a common callout component?)
  const items = useWorkItemBoardStore((s) =>
    selectedRepo ? s.getItems(selectedRepo.path) : [],
  );
  if (!selectedRepo) return null;

  const backlogItems = items.filter((i) => i.status === Status.Backlog);
  const inProgressItems = items.filter((i) => i.status === Status.InProgress);
  const doneItems = items.filter((i) => i.status === Status.Done);

  return (
    <section className="flex w-full flex-col gap-4 rounded-lg bg-gray-900 p-4 text-white">
      <section className="flex items-center justify-between">
        <h1>Tasks</h1>
        <button
          className="btn-primary"
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
        className="m-auto rounded-lg bg-gray-900 p-6 text-white backdrop:bg-black/90"
      >
        {isFormOpen && <WorkItemForm onClose={closeDialog} />}
      </dialog>

      <section className="flex min-h-32 w-full justify-between gap-2">
        <BoardColumn columnStatus={Status.Backlog} workItems={backlogItems} />
        <BoardColumn
          columnStatus={Status.InProgress}
          workItems={inProgressItems}
        />
        <BoardColumn columnStatus={Status.Done} workItems={doneItems} />
      </section>
    </section>
  );
};

export default Board;
