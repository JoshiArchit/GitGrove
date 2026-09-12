import { WorkItem } from "../../types/board.types";

type WorkItemCardProps = {
  item: WorkItem;
};
const WorkItemCard = ({ item }: WorkItemCardProps) => {
  return <div>Task</div>;
};

export default WorkItemCard;
