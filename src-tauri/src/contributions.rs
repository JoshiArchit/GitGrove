//! Uses the absolute path of the selected repository to get the contributions by day
//! The contributions are returned to the frontend for display and for generating the contributions graph.
//! Git command to get contributions for all authors in a repository for last 12 months: `git -C "<repo_path>" log --all --date=format:%Y-%m-%d --format='%ad' --since="1 year ago"`

use std::collections::HashMap;

/// Represents the contributions for a specific repository.
/// Used for displaying the contributions in the frontend.
#[derive(serde::Serialize)]
pub struct Contributions {
    pub contributions: HashMap<String, u32>,
}

#[tauri::command]
// TODO: Add a option for selecting period
pub fn get_contributions(repo_path: String) -> Contributions {
    let output = std::process::Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .arg("log")
        .arg("--all")
        .arg("--date=format:%Y-%m-%d")
        .arg("--format=%ad")
        .arg("--since=1 year ago")
        .output()
        .expect("Failed to execute git command");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut contributions: HashMap<String, u32> = HashMap::new();

    for line in stdout.lines() {
        if line.is_empty() {
            // TODO: Add logging
            continue;
        }

        contributions
            .entry(line.to_string())
            .and_modify(|c| *c += 1) // Increment the count if the email already exists
            .or_insert(1);
    }

    Contributions { contributions }
}

// Note: Since this functionality validates a git log, it is not feasible to test it without a git repository. Therefore, the tests for this functionality are designed to create a temporary git repository, make commits, and then validate the contributions. This ensures that the functionality is tested in a real-world scenario.
#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;

    fn run_git(repo_path: &std::path::Path, args: &[&str]) {
        let status = Command::new("git")
            .arg("-C")
            .arg(repo_path)
            .args(args)
            .status()
            .expect("failed to run git");
        assert!(status.success(), "git {:?} failed", args);
    }

    #[test]
    fn aggregates_commits_by_date_and_author() {
        let tmp = tempfile::tempdir().unwrap();
        let repo_path = tmp.path();

        run_git(repo_path, &["init"]);

        // Alice makes two commits
        run_git(repo_path, &["config", "user.name", "Alice"]);
        run_git(repo_path, &["config", "user.email", "alice@example.com"]);
        std::fs::write(repo_path.join("file1.txt"), "hello").unwrap();
        run_git(repo_path, &["add", "."]);
        run_git(repo_path, &["commit", "-m", "first commit"]);

        std::fs::write(repo_path.join("file2.txt"), "world").unwrap();
        run_git(repo_path, &["add", "."]);
        run_git(repo_path, &["commit", "-m", "second commit"]);

        // Bob makes one commit
        run_git(repo_path, &["config", "user.name", "Bob"]);
        run_git(repo_path, &["config", "user.email", "bob@example.com"]);
        std::fs::write(repo_path.join("file3.txt"), "!").unwrap();
        run_git(repo_path, &["add", "."]);
        run_git(repo_path, &["commit", "-m", "third commit"]);

        let result = get_contributions(repo_path.to_string_lossy().to_string());

        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let today_entry = result
            .contributions
            .get(&today)
            .expect("expected an entry for today's date");

        assert_eq!(today_entry, &3); // Alice's 2 commits + Bob's 1
    }
}
