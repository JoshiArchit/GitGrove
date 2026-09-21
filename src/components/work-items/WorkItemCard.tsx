import { useRef, useState } from "react";
import { resolveWorkItemColor } from "../../resolvers/workItemConfigResolver";
import { WorkItem } from "../../types/board.types";
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
        className={`flex w-full items-center gap-2 rounded-lg border-2 border-l-8 border-gray-600 px-4 py-2 hover:cursor-pointer hover:bg-gray-700 ${itemColor.borderLeft} transition-colors duration-150`}
        onClick={openDialog}
      >
        <div className="flex w-full flex-col">
          <span className="text-xs text-gray-600 uppercase">
          #{index + 1} {item.type}
          </span>
          <span>{item.title}</span>
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
