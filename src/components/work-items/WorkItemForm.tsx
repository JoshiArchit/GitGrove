import { SquareXIcon } from "lucide-react";
import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Status, WorkItem, WorkItemtype } from "../../types/board.types";

type WorkItemFormProps = {
  onClose: () => void;
};

type WorkItemFormValues = {
  title: string;
  description: string;
  branch: string;
  type: WorkItemtype;
};

const WorkItemForm = ({ onClose }: WorkItemFormProps) => {
  const branches = useSelectedRepoStore((s) => s.summary?.branches);
  const repoPath = useSelectedRepoStore((s) => s.repo!.path);
  const addItem = useWorkItemBoardStore((s) => s.addItem);
  const [description, setDescription] = useState<string>("");
  const [isPreview, setIsPreview] = useState<Boolean>(false);

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    //  Convert FormData to an object for easier handling
    const data = Object.fromEntries(formData) as unknown as WorkItemFormValues;

    // Create a WorkItem
    const workItem: WorkItem = {
      id: crypto.randomUUID(),
      type: data.type,
      title: data.title,
      description: description, // Use the state since when in preview, FormData cannot fetch description
      branch: data.branch,
      status: Status.New,
      tasks: [],
    };

    // Add work item to store
    addItem(repoPath, workItem);
    //  Reset the form after submission
    e.currentTarget.reset();

    onClose();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-h-[70vh] min-w-[70vw] flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Add New Item</h1>
        <button type="button" onClick={onClose} aria-label="Close">
          <SquareXIcon className="size-8 hover:cursor-pointer" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          name="title"
          placeholder="Enter title for the task"
          required
          className="input-element"
        />

        <div className="flex flex-col items-start justify-center gap-1">
          {isPreview ? (
            <div className="input-element prose prose-invert min-h-3/4">
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
            className="px-2 text-sm tracking-tight underline underline-offset-2 transition-all duration-300 hover:scale-125 hover:cursor-pointer"
          >
            {isPreview ? "Show Editor" : "Supports Markdown"}{" "}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex w-1/2 flex-col items-start justify-center gap-2">
          <label htmlFor="branch">Select a branch</label>
          <select
            id="branch"
            name="branch"
            className="w-full rounded-2xl border-2 border-solid border-gray-500 px-4 py-2 focus-visible:outline-none"
          >
            {branches?.map((e) => {
              return <option key={e}>{e}</option>;
            })}
          </select>
        </div>

        <div className="flex w-1/2 flex-col items-start justify-center gap-2">
          <label htmlFor="type">Select work item type</label>
          <select
            id="type"
            name="type"
            className="w-full rounded-2xl border-2 border-solid border-gray-500 px-4 py-2 focus-visible:outline-none"
          >
            {Object.values(WorkItemtype).map((e) => {
              return <option key={e}>{e}</option>;
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

export default WorkItemForm;
