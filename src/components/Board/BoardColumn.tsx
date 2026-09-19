import { Status, WorkItem } from "../../types/board.types";
import WorkItemCard from "../work-items/WorkItemCard";

type BoardColumnProps = {
  columnStatus: Status;
  workItems: WorkItem[];
};

const BoardColumn = ({ columnStatus, workItems }: BoardColumnProps) => {
  return (
    <section className="flex w-1/3 flex-col items-center justify-start gap-4 rounded-lg bg-black px-2 py-4">
      <span className="text-sm">{columnStatus}</span>

      <section className="flex w-full flex-col gap-2">
        {workItems.map((item) => {
          return (
            <div key={item.id}>
              <WorkItemCard item={item} />
            </div>
          );
        })}
      </section>
    </section>
  );
};

export default BoardColumn;
