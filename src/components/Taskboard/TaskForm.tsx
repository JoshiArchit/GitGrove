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
      <h2>TaskForm</h2>
      <button type="submit">Submit</button>
    </form>
  );
};

export default TaskForm;
