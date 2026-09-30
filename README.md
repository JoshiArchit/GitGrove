# GitGrove

A local, cross-platform desktop app for browsing and managing your git repositories, think _"VS Code, but for GitHub Desktop"_, with a lightweight, fully local project/task tracker layered on top, inspired by Azure DevOps boards, but with no server or cloud backend required.

Built with **Tauri + React + TypeScript + Tailwind CSS**.

## Why this exists

Googled "Best sources to learn React and Rust", most Reddit posts said "Build something." So I did. The core driver of this project is curiosity and solving a problem I face. If it helps someone else too, great! To anyone who asks why: why not?

I kept reaching for Notion or Obsidian just to jot down "what am I doing on this branch" or "what's the state of this side project," and both felt like massive overkill for that: heavy apps, sync accounts, way more surface area than a quick task note needs. GitGrove is my attempt at something narrower and local-first: repo status and lightweight task/project tracking, living next to the code it's actually about, with no account and no cloud dependency.

It's also a learning project: my first real time writing Rust (the Tauri backend) and my first time going deep on React/TypeScript outside of tutorials. Expect some rough edges and code that reflects "still figuring this out" in places. The plan is to keep this up as a public repo.

## Features

### Repository browsing

- Recursively scan a root folder for git repositories, or add a single repo directly
- Persisted repo list and scanned roots, pick up where you left off between launches
- **Repository summary**: current branch, remote URL, branch list, commit counts and dates, and a language breakdown (via [tokei](https://github.com/XAMPPRocky/tokei))
- **Contribution graph**: a calendar heatmap of daily commit activity

### Task board (per repository)

- Track **stories** and **bugs** as work items, each with a status (New / In Progress / Done), an optional branch, and a checklist of tasks
- Markdown-capable descriptions on both work items and tasks
- Board and Backlog views, with task-level status tracking (New / In Progress / Completed)

### Projects (decoupled from any repo)

- Track a project from first idea through deployment: a project doesn't need a repo to exist yet, or ever
- Lifecycle statuses: Idea → Brainstorming → In Development → In Test → Deployed
- Once a project is far enough along, link it to a repo from the scanned list, or scan/add one without leaving the dialog
- Tag stories and bugs (from any repo) to a project, and see them all in one place on the project's card

## Tech stack

| Layer          | Tech                                 |
| -------------- | ------------------------------------ |
| Shell          | [Tauri 2](https://tauri.app/)        |
| UI             | React 19, TypeScript, Tailwind CSS 4 |
| State          | Zustand                              |
| Charts         | ECharts                              |
| Animation      | Motion                               |
| Markdown       | react-markdown + remark-gfm          |
| Testing        | Vitest + Testing Library             |
| Rust (backend) | serde, tokei                         |

## Roadmap

Roughly in order:

1. **Settings page**: import/export JSON schemas for work items, projects, etc., so data isn't trapped in the app.
2. **SQL-backed storage**: data currently lives as JSON in the UI layer (`localStorage` / Tauri's store plugin); migrating to a real embedded SQL store and pushing more logic into Rust.
3. **UI/UX polish**: a lot of the interface right now is "make it work," not "make it nice."
4. **(Maybe) a companion VS Code extension**: surfacing tasks/projects for the currently-open repo without leaving the editor.
5. **A dev diary, scoped to a repo**: a running log for jotting down notes/decisions/context as you work, without leaving GitGrove to open yet another app.
6. **(Maybe) companion website** : A webpage to give an app overview, host binaries. 

**Stretch goal:** device migration for your exported data (building on #1): push an exported snapshot somewhere and pull it back down on a new machine. Not real-time cloud sync or an account system; the app stays local-storage-first, this would just be a manual, user-initiated way to move data between devices.

## Development

```bash
npm install
npm run tauri dev
```

Running `npm run dev` alone launches the Vite dev server in a plain browser, with Tauri's IPC layer mocked (`src/mocks/tauriMocks.ts`) so you can iterate on the UI without the native shell.

### Testing

```bash
npm run test           # watch mode
npm run test-coverage  # single run with coverage
```

### Building

```bash
npm run build       # type-check + web build
npm run tauri build # full native app bundle
```

## Project structure

```
src/
  components/     # UI, organized per feature (board, projects, repo-summary, work-items, tasks, ...)
  stores/         # Zustand stores (one per domain: repos, projects, work items, selected repo, app view)
  types/          # Shared TypeScript types
  mocks/          # Tauri IPC mocks for browser-only development
src-tauri/
  src/            # Rust backend: repo scanning, contribution/summary commands
```

## License

[MIT](LICENSE)
