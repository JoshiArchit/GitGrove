import { useRef, useState } from "react";
import { WorkItem } from "../../types/board.types";
import WorkItemCardExpanded from "./WorkItemCardExpanded";

type WorkItemCardProps = {
  item: WorkItem;
};

const WorkItemCard = ({ item }: WorkItemCardProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDirty, setIsDirty] = useState(false);

  function handleAttemptClose(e?: React.SyntheticEvent) {
    if (isDirty) {
      e?.preventDefault(); // stops the dialog from actually closing (Escape/backdrop path)
      const confirmed = window.confirm("Discard unsaved changes?");
      if (!confirmed) return;
    }
    dialogRef.current?.close();
  }

  return (
    <>
      <div
        className="w-full rounded-lg border-2 border-gray-600 px-4 py-2 hover:cursor-pointer hover:bg-gray-400"
        onClick={() => dialogRef.current?.showModal()}
      >
        <span>{item.title}</span>
      </div>

      <dialog
        ref={dialogRef}
        onCancel={handleAttemptClose}
        className="m-auto rounded-xl"
      >
        <WorkItemCardExpanded
          item={item}
          isDirty={isDirty}
          onDirtyChange={setIsDirty}
          onRequestClose={handleAttemptClose}
        />
      </dialog>
    </>
  );
};

export default WorkItemCard;
