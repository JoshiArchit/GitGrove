//! Recursively scans a root directory for git repositories.
//!
//! Detection is based on `.git` presence (directory or file, to support
//! worktree checkouts) rather than name or structure heuristics. Known
//! non-repo directories (`node_modules`, `dist`, `target`, etc.) are pruned
//! without descending into them — any repo nested inside a pruned subtree
//! is intentionally invisible to the scanner.

use walkdir::WalkDir;

const SKIP_DIRS: &[&str] = &["node_modules", "dist", "build", "target", ".next"];

/**
 * Recursively traverses the root folder to fetch git repositories using the walkdir crate.
 */
#[tauri::command]
pub fn scan_repos(root_directory: String) -> Vec<String> {
    let mut repos: Vec<String> = Vec::new();
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
            repos.push(path.to_string_lossy().to_string());
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
        // Top level repos
        std::fs::create_dir_all(tmp.path().join("repo-a/.git")).unwrap();
        std::fs::create_dir_all(tmp.path().join("nested/repo-b/.git")).unwrap();
        std::fs::create_dir_all(tmp.path().join("nested/node_modules/fake-pkg/.git")).unwrap();

        // Nested repos
        std::fs::create_dir_all(tmp.path().join("parent-folder/repo-c/.git")).unwrap();
        std::fs::create_dir_all(tmp.path().join("parent-folder/repo-c/dist/.git")).unwrap();

        let repos = scan_repos(tmp.path().to_string_lossy().to_string());

        assert_eq!(repos.len(), 3);
        // tmp dir auto-deletes when it goes out of scope
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
