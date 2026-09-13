import { WorkItem } from "../../types/board.types";

type WorkItemCardProps = {
  item: WorkItem;
};
const WorkItemCard = ({ item }: WorkItemCardProps) => {
  return (
    <div className="w-full rounded-lg border-2 border-gray-600 px-4 py-2 hover:cursor-pointer hover:bg-gray-400">
      <span>{item.title}</span>
    </div>
  );
};

export default WorkItemCard;
