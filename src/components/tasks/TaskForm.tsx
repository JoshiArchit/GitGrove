import { SquareXIcon } from "lucide-react";
import React from "react";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { Task, TaskStatus } from "../../types/board.types";

type TaskFormProps = {
  workItemId: string;
  task?: Task;
  isDirty: boolean;
  onDirtyChange: (isDirty: boolean) => void;
  onRequestClose: (e?: React.SyntheticEvent) => void;
  onSaved: () => void;
};

const TaskForm = ({
  workItemId,
  task,
  isDirty,
  onDirtyChange,
  onRequestClose,
  onSaved,
}: TaskFormProps) => {
  const repoPath = useSelectedRepoStore((s) => s.repo!.path);
  const addTask = useWorkItemBoardStore((s) => s.addTask);
  const updateTask = useWorkItemBoardStore((s) => s.updateTask);
  const deleteTask = useWorkItemBoardStore((s) => s.deleteTask);

  function checkDirty(form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form));
    const changed =
      data.title !== (task?.title ?? "") ||
      data.description !== (task?.description ?? "");
    onDirtyChange(changed);
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData) as unknown as {
      title: string;
      description: string;
    };

    if (task) {
      updateTask(repoPath, workItemId, task.id, {
        title: data.title,
        description: data.description,
      });
    } else {
      addTask(repoPath, workItemId, {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        status: TaskStatus.New,
      });
    }

    onDirtyChange(false);
    onSaved();
  }

  function handleDelete() {
    if (!task) return;
    const confirmed = window.confirm("Delete this task? This can't be undone.");
    if (!confirmed) return;

    deleteTask(repoPath, workItemId, task.id);
    onDirtyChange(false);
    onSaved();
  }

  return (
    <div className="shadow-card-elevation-2 flex min-w-[75vw] flex-col gap-4 border-t-8 border-t-amber-400 bg-gray-800 px-6 py-4 text-white">
      <div className="flex w-full items-center justify-between">
        <span>{task ? "Edit Task" : "Add Task"}</span>
        <button type="button" onClick={onRequestClose}>
          <SquareXIcon className="size-8 rounded-lg" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        onInput={(e) => checkDirty(e.currentTarget)}
        className="flex flex-col gap-4"
      >
        <input
          name="title"
          type="text"
          defaultValue={task?.title}
          placeholder="Enter title for the Task"
          required
          className="input-element"
        />

        <textarea
          name="description"
          defaultValue={task?.description}
          placeholder="Enter description for the Task"
          className="input-element min-h-3/4"
        ></textarea>

        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            className="btn-primary disabled:btn-disabled"
            disabled={!isDirty}
          >
            Save
          </button>
          <button type="button" className="btn-cancel" onClick={onRequestClose}>
            Cancel
          </button>
          {task && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
