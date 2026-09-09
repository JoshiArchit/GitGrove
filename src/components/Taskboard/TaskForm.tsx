import React from "react";

type TaskFormProps = {
  repoPath: string;
  onClose: () => void;
};

const TaskForm = ({ repoPath, onClose }: TaskFormProps) => {
  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    onClose();
  }
  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-2xl font-medium">Add New Task</h1>
      <button type="submit" className="btn-primary">
        Submit
      </button>
    </form>
  );
};

export default TaskForm;
