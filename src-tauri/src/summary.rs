//! Uses the absolute path of the selected repository to compute a summary snapshot for display in the frontend.
//! Language line counts are computed via the `tokei` crate; everything else shells out to `git`.
//!
//! Git commands used:
//! - Current branch:   `git -C "<repo_path>" rev-parse --abbrev-ref HEAD`
//! - Remote URL:        `git -C "<repo_path>" remote get-url origin` (no `origin` remote → `None`)
//! - Branch count:      `git -C "<repo_path>" branch --list` (line count of output)
//! - Total commits:     `git -C "<repo_path>" rev-list --count HEAD`
//! - First commit date: `git -C "<repo_path>" log --reverse --format=%ad --date=format:%Y-%m-%d -1`
//! - Last commit date:  `git -C "<repo_path>" log -1 --format=%ad --date=format:%Y-%m-%d`

use std::collections::HashMap;
use tokei::{Config, Languages};

/// Represents a summary snapshot of a specific repository.
/// Used for displaying the summary in the frontend.
#[derive(serde::Serialize, Default)]
pub struct RepoSummary {
    pub current_branch: String,
    pub remote_url: Option<String>, // If no origin set yet
    pub branch_count: u32,
    pub total_commits: u32,
    pub first_commit_date: String,         // YYYY-MM-DD
    pub last_commit_date: String,          // YYYY-MM-DD
    pub languages: HashMap<String, usize>, // language name -> code line count (via tokei)
}

/// Computes a summary snapshot (current branch, remote, branch/commit counts, first/last commit dates, and language breakdown) for the given repository.
#[tauri::command]
pub fn get_repo_summary(repo_path: String) -> RepoSummary {
    let current_branch = run_git(&repo_path, &["rev-parse", "--abbrev-ref", "HEAD"]);

    let remote_url = run_git(&repo_path, &["remote", "get-url", "origin"]);
    let remote_url = if remote_url.is_empty() {
        None
    } else {
        Some(remote_url)
    };

    let branch_count = run_git(&repo_path, &["branch", "--list"]).lines().count() as u32;

    let total_commits = run_git(&repo_path, &["rev-list", "--count", "HEAD"])
        .parse::<u32>()
        .expect("git rev-list --count should output a valid number");

    let first_commit_date = run_git(
        &repo_path,
        &[
            "log",
            "-1",
            "--reverse",
            "--format=%ad",
            "--date=format:%Y-%m-%d",
        ],
    );

    let last_commit_date = run_git(
        &repo_path,
        &["log", "-1", "--format=%ad", "--date=format:%Y-%m-%d"],
    );

    let languages = get_languages(&repo_path);

    RepoSummary {
        current_branch,
        remote_url,
        branch_count,
        total_commits,
        first_commit_date,
        last_commit_date,
        languages,
    }
}

/// Runs a git command against the given repository path and returns the stdout as a String.
fn run_git(repo_path: &str, args: &[&str]) -> String {
    let output = std::process::Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(args)
        .output()
        .expect("git should be installed and runnable");
    String::from_utf8_lossy(&output.stdout).trim().to_string()
}

/// Computes the language breakdown (language name -> code line count) for the given repository using the `tokei` crate.
fn get_languages(repo_path: &str) -> HashMap<String, usize> {
    let mut tokei_languages = Languages::new();
    let config = Config::default();

    tokei_languages.get_statistics(&[repo_path], &[], &config);

    tokei_languages
        .iter()
        .filter(|(_, language)| language.code > 0)
        .map(|(lang_type, language)| (lang_type.to_string(), language.code))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::process::Command;

    fn git(repo_path: &std::path::Path, args: &[&str]) {
        let status = Command::new("git")
            .arg("-C")
            .arg(repo_path)
            .args(args)
            .status()
            .expect("failed to run git");
        assert!(status.success(), "git {:?} failed", args);
    }

    #[test]
    fn computes_repo_summary_fields() {
        let tmp = tempfile::tempdir().unwrap();
        let repo_path = tmp.path();

        git(repo_path, &["init"]);
        git(repo_path, &["checkout", "-b", "test-branch"]);
        git(repo_path, &["config", "user.name", "Test User"]);
        git(repo_path, &["config", "user.email", "test@example.com"]);
        git(
            repo_path,
            &[
                "remote",
                "add",
                "origin",
                "https://github.com/example/repo.git",
            ],
        );

        fs::write(
            repo_path.join("main.py"),
            "print(\"one\")\nprint(\"two\")\nprint(\"three\")\n",
        )
        .unwrap();
        git(repo_path, &["add", "."]);
        git(repo_path, &["commit", "-m", "first commit"]);

        fs::write(repo_path.join("second.py"), "print(\"four\")\n").unwrap();
        git(repo_path, &["add", "."]);
        git(repo_path, &["commit", "-m", "second commit"]);

        git(repo_path, &["branch", "other-branch"]);

        let summary = get_repo_summary(repo_path.to_string_lossy().to_string());

        let today = chrono::Local::now().format("%Y-%m-%d").to_string();

        assert_eq!(summary.current_branch, "test-branch");
        assert_eq!(
            summary.remote_url,
            Some("https://github.com/example/repo.git".to_string())
        );
        assert_eq!(summary.branch_count, 2);
        assert_eq!(summary.total_commits, 2);
        assert_eq!(summary.first_commit_date, today);
        assert_eq!(summary.last_commit_date, today);
        assert_eq!(summary.languages.get("Python"), Some(&4));
    }

    #[test]
    fn remote_url_is_none_without_origin() {
        let tmp = tempfile::tempdir().unwrap();
        let repo_path = tmp.path();

        git(repo_path, &["init"]);
        git(repo_path, &["config", "user.name", "Test User"]);
        git(repo_path, &["config", "user.email", "test@example.com"]);

        fs::write(repo_path.join("file.txt"), "hello").unwrap();
        git(repo_path, &["add", "."]);
        git(repo_path, &["commit", "-m", "initial commit"]);

        let summary = get_repo_summary(repo_path.to_string_lossy().to_string());

        assert_eq!(summary.remote_url, None);
    }
}
