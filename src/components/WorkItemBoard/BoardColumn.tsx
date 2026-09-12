import { Status, WorkItem } from "../../types/board.types";

type BoardColumnProps = {
  columnStatus: Status;
  workItems: WorkItem[];
};

const BoardColumn = ({ columnStatus, workItems }: BoardColumnProps) => {
  return (
    <section className="flex w-1/3 flex-col items-center justify-between rounded-lg bg-black px-2 py-4">
      <span className="text-sm">{columnStatus}</span>
    </section>
  );
};

export default BoardColumn;
