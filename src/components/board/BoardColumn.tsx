import { useDroppable } from "@dnd-kit/react";
import { Status, WorkItem } from "../../types/board.types";
import WorkItemCard from "../work-items/WorkItemCard";

type BoardColumnProps = {
  columnStatus: Status;
  workItems: WorkItem[];
};

const BoardColumn = ({ columnStatus, workItems }: BoardColumnProps) => {
  const { ref, isDropTarget } = useDroppable({ id: columnStatus });

  return (
    <section
      className={`shadow-card-elevation-2 flex w-1/3 flex-col items-center justify-start gap-4 rounded-lg bg-black px-2 py-4 transition-all duration-300 ${isDropTarget ? "ring-2 ring-blue-500" : ""}`}
      ref={ref}
    >
      <span>{columnStatus}</span>

      <section className="flex w-full flex-col gap-2">
        {workItems.length ? (
          workItems.map((item, index) => {
            return (
              <div key={item.id}>
                <WorkItemCard item={item} index={index} />
              </div>
            );
          })
        ) : (
          <span className="flex w-full justify-center text-sm text-gray-600">
            No items
          </span>
        )}
      </section>
    </section>
  );
};

export default BoardColumn;
