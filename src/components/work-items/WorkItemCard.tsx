import { ClipboardCheck } from "lucide-react";
import { useRef, useState } from "react";
import { resolveWorkItemColor } from "../../resolvers/workItemConfigResolver";
import { TaskStatus, WorkItem } from "../../types/board.types";
import WorkItemCardExpanded from "./WorkItemCardExpanded";

type WorkItemCardProps = {
  item: WorkItem;
  index: number;
};

const WorkItemCard = ({ item, index }: WorkItemCardProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  const itemColor = resolveWorkItemColor(item.type);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function openDialog() {
    // Bumping the key remounts WorkItemCardExpanded, resetting its uncontrolled
    // fields back to `item`'s real values — discards whatever was typed and
    // left unsaved from a prior open (e.g. a cancelled edit).
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
        className={`flex w-full items-center gap-2 rounded-lg border-2 border-l-8 border-gray-600 px-4 py-2 hover:cursor-pointer hover:bg-gray-700 ${itemColor.borderLeft} transition-all duration-150 hover:scale-105`}
        onClick={openDialog}
      >
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-gray-600 uppercase">
            <span>
              #{index + 1} {item.type}
            </span>
            <span>Tasks completed</span>
          </div>

          <div className="flex items-center justify-between">
            <span>{item.title}</span>
            {item.tasks.length === 0 ? (
              <span className="text-gray-500">No tasks</span>
            ) : (
              <span className="flex items-center justify-between gap-1">
                <ClipboardCheck className="text-amber-300" />{" "}
                {
                  item.tasks.filter(
                    (task) => task.status === TaskStatus.Completed,
                  ).length
                }
                /{item.tasks.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onCancel={handleAttemptClose}
        className="m-auto rounded-xl backdrop:bg-black/80"
      >
        <WorkItemCardExpanded
          key={instanceKey}
          item={item}
          isDirty={isDirty}
          onDirtyChange={setIsDirty}
          onRequestClose={handleAttemptClose}
          onSaved={closeDialog}
        />
      </dialog>
    </>
  );
};

export default WorkItemCard;
