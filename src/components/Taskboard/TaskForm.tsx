import React from "react";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { WorkItemtype } from "../../types/board.types";

type TaskFormProps = {
  repoPath: string;
  onClose: () => void;
};

const TaskForm = ({ repoPath, onClose }: TaskFormProps) => {
  const branches = useSelectedRepoStore((s) => s.summary?.branches);

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log(Object.fromEntries(formData));
    onClose();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-h-[70vh] min-w-[70vw] flex-col gap-4"
    >
      <h1 className="text-2xl font-medium">Add New Task</h1>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          name="title"
          placeholder="Enter title for the task"
          required
          className="w-full rounded-xl border-2 border-solid border-gray-500 px-4 py-2 transition-all duration-200 focus-visible:border-blue-200 focus-visible:bg-gray-500 focus-visible:outline-none"
        />

        <textarea
          name="description"
          placeholder="Add description"
          className="max-h-3/4 w-full rounded-xl border-2 border-solid border-gray-500 px-4 py-2 transition-all duration-200 focus-visible:border-blue-200 focus-visible:bg-gray-500 focus-visible:outline-none"
        ></textarea>
      </div>

      <div className="flex gap-4">
        <div className="flex w-1/2 flex-col items-start justify-center gap-2">
          <label htmlFor="branch">Select a branch</label>
          <select
            name="branch"
            className="w-full rounded-2xl border-2 border-solid border-gray-500 px-4 py-2 focus-visible:outline-none"
          >
            {branches?.map((e) => {
              return <option key={e}>{e}</option>;
            })}
          </select>
        </div>

        <div className="flex w-1/2 flex-col items-start justify-center gap-2">
          <label htmlFor="workitem-type">Select work item type</label>
          <select
            name="workitem-type"
            className="w-full rounded-2xl border-2 border-solid border-gray-500 px-4 py-2 focus-visible:outline-none"
          >
            {Object.values(WorkItemtype).map((e) => {
              return <option>{e}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="flex justify-start gap-4">
        <button type="submit" className="btn-primary min-w-24">
          Submit
        </button>
        <button type="reset" className="btn-cancel min-w-24" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
