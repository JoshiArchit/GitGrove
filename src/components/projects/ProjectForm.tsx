import { XIcon } from "lucide-react";
import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useProjectsStore } from "../../stores/projectsStore";
import { Project, ProjectStatus } from "../../types/project.types";

type ProjectFormProps = {
  isDirty: boolean;
  onDirtyChange: (isDirty: boolean) => void;
  onRequestClose: (e?: React.SyntheticEvent) => void;
  onSaved: () => void;
};

type ProjectFormValues = {
  title: string;
};

const ProjectForm = ({
  isDirty,
  onDirtyChange,
  onRequestClose,
  onSaved,
}: ProjectFormProps) => {
  const addProject = useProjectsStore((s) => s.addProject);
  const [description, setDescription] = useState<string>("");
  const [isPreview, setIsPreview] = useState<boolean>(false);

  function checkDirty(form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form));
    const changed = Boolean(data.title) || Boolean(description);
    onDirtyChange(changed);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData) as unknown as ProjectFormValues;

    const project: Project = {
      projectId: Date.now(),
      title: data.title,
      description, // Use the state since when in preview, FormData cannot fetch description
      status: ProjectStatus.Idea,
    };

    addProject(project);
    onDirtyChange(false);
    onSaved();
  }

  return (
    <form
      onSubmit={handleSubmit}
      onInput={(e) => checkDirty(e.currentTarget)}
      className="flex max-h-[70vh] min-w-[70vw] flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Add New Project</h1>
        <button type="button" onClick={onRequestClose} aria-label="Close">
          <XIcon className="size-8 hover:cursor-pointer" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          name="title"
          placeholder="Enter a title for the project"
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
            {isPreview ? "Show Editor" : "Supports Markdown"}
          </button>
        </div>
      </div>

      <div className="flex justify-start gap-4">
        <button
          type="submit"
          className="btn-primary disabled:btn-disabled min-w-24"
          disabled={!isDirty}
        >
          Submit
        </button>
        <button
          type="button"
          className="btn-cancel min-w-24"
          onClick={onRequestClose}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
