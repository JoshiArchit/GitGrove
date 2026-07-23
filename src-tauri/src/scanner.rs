//! Recursively scans a root directory for git repositories.
//!
//! Detection is based on `.git` presence (directory or file, to support
//! worktree checkouts) rather than name or structure heuristics. Known
//! non-repo directories (`node_modules`, `dist`, `target`, etc.) are pruned
//! without descending into them — any repo nested inside a pruned subtree
//! is intentionally invisible to the scanner.

use walkdir::WalkDir;

// TODO: Make this a user enforced list, give them the choice to exclude directories.
// Keep these are the suggested defaults, add pycache and other stack agnostic gitignored directories (maybe look at templates for gitignore)
const SKIP_DIRS: &[&str] = &["node_modules", "dist", "build", "target", ".next"];

/// A discovered git repository, returned to the frontend for display and
/// as the canonical identifier for subsequent per-repo commands.
#[derive(serde::Serialize)]
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

        if (path.join(".git")).exists() {
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            repos.push(RepoEntry {
                path: path.to_string_lossy().to_string(),
                name,
            });
            iterator.skip_current_dir(); // Skips the current directory since repo path has already been determined
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
}
