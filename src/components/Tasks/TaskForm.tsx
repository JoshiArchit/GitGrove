import { SquareXIcon } from "lucide-react";

type TaskFormProps = {
  onCancel: () => void;
};

const TaskForm = ({ onCancel }: TaskFormProps) => {
  return (
    <div className="shadow-card-elevation-2 flex min-w-[75vw] flex-col gap-4 border-t-8 border-t-amber-400 bg-gray-800 px-6 py-4 text-white">
      <div className="flex w-full items-center justify-between">
        <span>Add Task</span>
        <button onClick={onCancel}>
          <SquareXIcon className="size-8 rounded-lg" />
        </button>
      </div>

      <form className="flex flex-col gap-4">
        <input
          name="title"
          type="text"
          defaultValue="Enter title for the Task"
          className="input-element"
        ></input>

        <textarea
          name="description"
          className="input-element min-h-3/4"
          defaultValue="Enter description for the Task"
        ></textarea>
      </form>
    </div>
  );
};

export default TaskForm;
