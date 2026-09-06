/**
 * Enum representing the type of a work item.
 */
export enum WorkItemtype {
  Story,
  Bug,
}

// TODO: Extensibility - Do we need New, Committed, Code Review, Ready for Testing, In Test?
/**
 * Enum representing the status of a work item.
 * This can be used to track the progress of a work item through different stages.
 */
export enum Status {
  Backlog,
  InProgress,
  Done,
}

/**
 * Type representing a task associated with a work item.
 * Each task has a unique identifier, a title, and a boolean indicating whether it is done.
 */
export type Task = {
  id: string;
  title: string;
  done: boolean;
};

/**
 * Type representing a work item, which can be a story, bug, or other types of tasks.
 * Each work item has a unique identifier, a type, a title, a description, a status, an optional branch name, and a list of associated tasks.
 */
export type WorkItem = {
  id: string;
  type: WorkItemtype;
  title: string;
  description: string;
  status: Status;
  branch?: string;
  tasks: Task[];
};
