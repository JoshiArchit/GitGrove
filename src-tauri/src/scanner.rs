//! Discovers git repositories, either by recursively scanning a root directory
//! or by checking a single given path directly.
//!
//! Detection is based on `.git` presence (directory or file, to support
//! worktree checkouts) rather than name or structure heuristics. Known
//! non-repo directories (`node_modules`, `dist`, `target`, etc.) are pruned
//! without descending into them during a recursive scan — any repo nested
//! inside a pruned subtree is intentionally invisible to the scanner.
//!
//! Both `scan_repos` (recursive) and `get_repo_from_path` (single path, for
//! adding an individual repo outside the scanned root) share the same
//! `.git`-detection and `RepoEntry`-construction logic via `path_to_repo_entry`.

use std::path::Path;

use walkdir::WalkDir;

// TODO: Make this a user enforced list, give them the choice to exclude directories.
// Keep these are the suggested defaults, add pycache and other stack agnostic gitignored directories (maybe look at templates for gitignore)
const SKIP_DIRS: &[&str] = &["node_modules", "dist", "build", "target", ".next"];

/// A discovered git repository, returned to the frontend for display and
/// as the canonical identifier for subsequent per-repo commands.
#[derive(serde::Serialize, Default)]
pub struct RepoEntry {
    /// Absolute path on disk — the identifier passed to other commands.
    pub path: String,
    /// Display-only folder name, derived from `path`.
    pub name: String,
}

/**
 * Recursively traverses the root folder to fetch git repositories using the walkdir crate.
 */
#[tauri::command]
pub fn scan_repos(root_directory: String) -> Vec<RepoEntry> {
    let mut repos: Vec<RepoEntry> = Vec::new();
    let mut iterator = WalkDir::new(root_directory).into_iter();

    while let Some(entry) = iterator.next() {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue, // unreadable entry, dont panic and crash the scan, continue.
                                // TODO #Logs : Add logging to record these exceptions
        };

        // Skip all non-directories
        if !entry.file_type().is_dir() {
            continue;
        }

        let path = entry.path();

        if let Some(repo) = path_to_repo_entry(path) {
            repos.push(repo);
            iterator.skip_current_dir();
            continue;
        }

        // Rarely triggers: .git detection above already prunes most subtrees
        // before reaching heavy dirs like node_modules — this only catches
        // junk folders sitting outside any repo boundary.
        // TODO: Can we use .gitignore instead of a const list
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if SKIP_DIRS.contains(&name) {
                iterator.skip_current_dir();
            }
        }
    }

    repos
}

/**
 * Fetches a single git repository from a given path, returning `None` if the
 * path is not a git repository.
 */
#[tauri::command]
pub fn get_repo_from_path(path: String) -> Option<RepoEntry> {
    path_to_repo_entry(Path::new(&path))
}

/// Builds a RepoEntry from a path if it's a git repository, `None` otherwise.
fn path_to_repo_entry(path: &Path) -> Option<RepoEntry> {
    if !path.join(".git").exists() {
        return None;
    }

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    Some(RepoEntry {
        path: path.to_string_lossy().to_string(),
        name,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_repos_in_nested_folders() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(tmp.path().join("repo-a/.git")).unwrap();
        std::fs::create_dir_all(tmp.path().join("nested/repo-b/.git")).unwrap();
        std::fs::create_dir_all(tmp.path().join("nested/node_modules/fake-pkg/.git")).unwrap();
        std::fs::create_dir_all(tmp.path().join("parent-folder/repo-c/.git")).unwrap();
        std::fs::create_dir_all(tmp.path().join("parent-folder/repo-c/dist/.git")).unwrap();

        let repos = scan_repos(tmp.path().to_string_lossy().to_string());

        assert_eq!(repos.len(), 3);

        let repo_a = repos
            .iter()
            .find(|r| r.name == "repo-a")
            .expect("repo-a not found");
        assert_eq!(
            repo_a.path,
            tmp.path().join("repo-a").to_string_lossy().to_string()
        );

        let repo_c = repos
            .iter()
            .find(|r| r.name == "repo-c")
            .expect("repo-c not found");
        assert_eq!(
            repo_c.path,
            tmp.path()
                .join("parent-folder/repo-c")
                .to_string_lossy()
                .to_string()
        );
    }

    #[test]
    fn returns_empty_for_folder_with_no_repos() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(tmp.path().join("just-a-folder/src")).unwrap();
        std::fs::write(tmp.path().join("just-a-folder/Cargo.toml"), "").unwrap();

        let repos = scan_repos(tmp.path().to_string_lossy().to_string());

        assert!(repos.is_empty());
    }

    #[test]
    fn nonexistent_root_does_not_panic() {
        let repos = scan_repos("/this/path/does/not/exist".to_string());

        assert!(repos.is_empty());
    }

    #[test]
    fn finds_repo_with_given_path() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(tmp.path().join("repo-a/.git")).unwrap();

        let repo_path = tmp.path().join("repo-a").to_string_lossy().to_string();
        let repo = get_repo_from_path(repo_path.clone());

        let repo = repo.expect("expected repo-a to be recognized as a repo");
        assert_eq!(repo.path, repo_path);
        assert_eq!(repo.name, "repo-a");
    }

    #[test]
    fn returns_none_for_path_without_git() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(tmp.path().join("just-a-folder")).unwrap();

        let repo = get_repo_from_path(
            tmp.path()
                .join("just-a-folder")
                .to_string_lossy()
                .to_string(),
        );

        assert!(repo.is_none());
    }

    #[test]
    fn returns_none_for_nonexistent_path() {
        let repo = get_repo_from_path("/this/path/does/not/exist".to_string());

        assert!(repo.is_none());
    }
}
