import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project } from "../types/project.types";

type projectsStore = {
  showProjects: boolean;
  openProjects: () => void;
  closeProjects: () => void;
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjects: () => Project[];
};

/**
 * Store for managing the state of projects in the application. It includes methods to open and close the projects view, as well as to add, update, delete, and retrieve projects from the store.
 * The store uses Zustand for state management and persists the state using local storage with the key "gitgrove-projects".
 * This allows the application to maintain the state of projects across sessions.
 */
export const useProjectsStore = create<projectsStore>()(
  persist(
    (set, get) => ({
      // State and methods for managing the visibility of the projects view in the application.
      showProjects: false,

      openProjects: () =>
        set({
          showProjects: true,
        }),

      closeProjects: () =>
        set({
          showProjects: false,
        }),

      // Project management methods to add, update, delete, and retrieve projects from the store.
      projects: [],

      addProject: (project) => {
        set((state) => ({
          projects: [...state.projects, project],
        }));
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.projectId === id ? { ...p, ...updates } : p,
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.projectId !== id),
        }));
      },

      getProjects: () => get().projects,
    }),
    { name: "gitgrove-projects" },
  ),
);
