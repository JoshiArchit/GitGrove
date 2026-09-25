import { SquareXIcon } from "lucide-react";
import React, { useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveWorkItemColor } from "../../resolvers/workItemConfigResolver";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Status, WorkItem } from "../../types/board.types";
import TaskCard from "../tasks/TaskCard";
import TaskForm from "../tasks/TaskForm";

type WorkItemCardExpandedProps = {
  item: WorkItem;
  isDirty: boolean;
  onDirtyChange: (isDirty: boolean) => void;
  onRequestClose: (e?: React.SyntheticEvent) => void;
  onSaved: () => void;
};

const WorkItemCardExpanded = ({
  item,
  isDirty,
  onDirtyChange,
  onRequestClose,
  onSaved,
}: WorkItemCardExpandedProps) => {
  const repoPath = useSelectedRepoStore((s) => s.repo!.path);
  const updateItem = useWorkItemBoardStore((s) => s.updateItem);
  const deleteItem = useWorkItemBoardStore((s) => s.deleteItem);
  const itemColor = resolveWorkItemColor(item.type);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isTaskFormDirty, setIsTaskFormDirty] = useState(false);
  const [taskFormInstanceKey, setTaskFormInstanceKey] = useState(0);
  const [description, setDescription] = useState<string>(
    item.description ?? "",
  );
  const [isPreview, setIsPreview] = useState<Boolean>(false);

  function checkDirty(form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form));
    const changed =
      data.title !== item.title ||
      description !== item.description ||
      data.status !== item.status;
    onDirtyChange(changed);
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData) as unknown as {
      title: string;
      status: Status;
    };

    updateItem(repoPath, item.id, {
      title: data.title,
      description: description,
      status: data.status,
    });

    onDirtyChange(false);
    onSaved();
  }

  function handleDelete() {
    const confirmed = window.confirm("Delete this item? This can't be undone.");
    if (!confirmed) return;

    deleteItem(repoPath, item.id);
    onDirtyChange(false);
    onSaved();
  }

  function closeTaskFormDialog() {
    dialogRef.current?.close();
  }

  function openTaskFormDialog() {
    setIsTaskFormDirty(false);
    setTaskFormInstanceKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function handleAttemptCloseTaskForm(e?: React.SyntheticEvent) {
    if (isTaskFormDirty) {
      e?.preventDefault();
      const confirmed = window.confirm("Discard unsaved changes?");
      if (!confirmed) return;
    }
    closeTaskFormDialog();
  }

  return (
    <div
      className={`shadow-card-elevation-2 flex w-[75vw] flex-col gap-4 overflow-auto border-t-8 bg-gray-900 px-6 py-4 ${itemColor.borderTop}`}
    >
      <form
        onSubmit={handleSubmit}
        onInput={(e) => checkDirty(e.currentTarget)}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold tracking-widest text-white uppercase">
            {item.type}
          </span>

          <div className="flex items-center justify-end gap-4 text-white">
            <button
              className="btn-primary disabled:btn-disabled"
              type="submit"
              disabled={!isDirty}
            >
              Save
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onRequestClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDelete}
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onRequestClose}
              className="text-gray-300 transition-all duration-300 hover:cursor-pointer hover:text-white"
            >
              <SquareXIcon className="size-8 rounded-lg" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="text-white">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="w-max rounded-2xl border-2 border-solid border-gray-500 px-4 py-2 text-white focus-visible:outline-none"
            defaultValue={item.status}
          >
            {Object.values(Status).map((e) => {
              return <option key={e}>{e}</option>;
            })}
          </select>
        </div>
        <input
          type="text"
          name="title"
          defaultValue={item.title}
          required
          className="input-element"
        />

        <div className="flex flex-col items-start justify-center gap-1">
          {isPreview ? (
            <div className="input-element prose prose-invert max-h-3/4 overflow-auto bg-gray-900">
              <Markdown remarkPlugins={[remarkGfm]}>
                {description || "*Nothing to preview yet*"}
              </Markdown>
            </div>
          ) : (
            <textarea
              name="description"
              placeholder="Add description"
              className="input-element max-h-3/4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          )}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="px-2 text-sm tracking-tight text-white underline underline-offset-2 transition-all duration-300 hover:scale-110 hover:cursor-pointer"
          >
            {isPreview ? "Show Editor" : "Supports Markdown"}{" "}
          </button>
        </div>
      </form>

      <hr className="h-0.5 w-full bg-white" />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold tracking-widest text-white uppercase">
            Tasks
          </span>
          <button
            type="button"
            className="btn-primary text-white"
            onClick={openTaskFormDialog}
          >
            Add Task
          </button>
        </div>

        <section className="flex max-h-64 flex-col gap-4 overflow-auto rounded-xl border border-gray-500 px-4 py-2">
          {item.tasks.length === 0 && (
            <span className="text-gray-400">No tasks for the item</span>
          )}
          {item.tasks.map((task) => {
            return <TaskCard key={task.id} workItemId={item.id} task={task} />;
          })}
        </section>
      </section>

      <dialog
        className="m-auto rounded-xl backdrop:bg-gray-900/60"
        ref={dialogRef}
        onCancel={handleAttemptCloseTaskForm}
      >
        <TaskForm
          key={taskFormInstanceKey}
          workItemId={item.id}
          isDirty={isTaskFormDirty}
          onDirtyChange={setIsTaskFormDirty}
          onRequestClose={handleAttemptCloseTaskForm}
          onSaved={closeTaskFormDialog}
        />
      </dialog>
    </div>
  );
};

export default WorkItemCardExpanded;
