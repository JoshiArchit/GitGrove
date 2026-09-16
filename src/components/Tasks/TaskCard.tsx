import { Task } from "../../types/board.types";

type TaskCardProps = {
  task: Task;
};

const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <div className="rounded-lg border-2 border-l-6 border-gray-400 border-l-amber-400 px-2 py-1 text-white hover:border-black hover:bg-amber-100 hover:text-black">
      {task.title}
    </div>
  );
};

export default TaskCard;
