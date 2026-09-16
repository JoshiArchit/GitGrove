import { useRef, useState } from "react";
import { Task } from "../../types/board.types";
import TaskForm from "./TaskForm";

type TaskCardProps = {
  workItemId: string;
  task: Task;
};

const TaskCard = ({ workItemId, task }: TaskCardProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function openDialog() {
    // Bumping the key remounts TaskForm, resetting its uncontrolled fields
    // back to `task`'s real values — discards whatever was typed and left
    // unsaved from a prior open (e.g. a cancelled edit).
    setIsDirty(false);
    setInstanceKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function handleAttemptClose(e?: React.SyntheticEvent) {
    if (isDirty) {
      e?.preventDefault(); // stops the dialog from actually closing (Escape/backdrop path)
      const confirmed = window.confirm("Discard unsaved changes?");
      if (!confirmed) return;
    }
    closeDialog();
  }

  return (
    <>
      <div
        className="w-full truncate rounded-lg border-2 border-l-6 border-gray-400 border-l-amber-400 px-2 py-1 text-wrap text-white hover:cursor-pointer hover:border-black hover:bg-amber-100 hover:text-black"
        onClick={openDialog}
      >
        {task.title}
      </div>

      <dialog
        ref={dialogRef}
        onCancel={handleAttemptClose}
        className="m-auto rounded-xl backdrop:bg-gray-900/60"
      >
        <TaskForm
          key={instanceKey}
          workItemId={workItemId}
          task={task}
          isDirty={isDirty}
          onDirtyChange={setIsDirty}
          onRequestClose={handleAttemptClose}
          onSaved={closeDialog}
        />
      </dialog>
    </>
  );
};

export default TaskCard;
