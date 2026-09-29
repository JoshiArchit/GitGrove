/**
 * Enumeration representing the various statuses a project can have during its lifecycle. Each status is associated with a string value that describes the stage of the project.
 * - Idea: The project is in the initial idea phase.
 * - Brainstorming: The project is in the brainstorming phase, where ideas are being discussed and documented.
 * - InDevelopment: The project is actively being developed - a repo is associated with it.
 * - InTest: The project is undergoing testing to ensure quality and functionality.
 * - Deployed: The project has been deployed and is live or in production - a local repo may/may not be available.
 */
export enum ProjectStatus {
  Idea = "Idea",
  Brainstorming = "Brainstorming",
  InDevelopment = "In Development",
  InTest = "In Test",
  Deployed = "Deployed",
}

/**
 * Type representing a project in the application. Each project has a unique identifier, a title, a status indicating its current phase, a description, and an optional associated repository path.
 * Associated work items (stories, bugs) aren't stored here — they're found by filtering the work-item board store for items whose `project` field matches this project's `projectId`.
 */
export type Project = {
  projectId: number;
  title: string;
  status: ProjectStatus;
  description: string;
  repo?: string | undefined;
};
