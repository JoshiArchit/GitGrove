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
    let current_branch = std::process::Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .arg("rev-parse")
        .arg("--abbrev-ref")
        .arg("HEAD")
        .output()
        .expect("git should be installed and able to resolve the current branch");
    let current_branch = String::from_utf8_lossy(&current_branch.stdout)
        .trim()
        .to_string();

    let remote_url = std::process::Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .arg("remote")
        .arg("get-url")
        .arg("origin")
        .output()
        .expect("git should be installed and able to resolve the remote url");
    let remote_url = String::from_utf8_lossy(&remote_url.stdout)
        .trim()
        .to_string();
    let remote_url = if remote_url.is_empty() {
        None
    } else {
        Some(remote_url)
    };

    let branch_count = std::process::Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .arg("branch")
        .arg("--list")
        .output()
        .expect("git should be installed and able to get branch count");
    let branch_count = String::from_utf8_lossy(&branch_count.stdout)
        .lines()
        .count() as u32;

    let total_commits = std::process::Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .arg("rev-list")
        .arg("--count")
        .arg("HEAD")
        .output()
        .expect("git should be installed and able to get count of commits on main");
    let total_commits = String::from_utf8_lossy(&total_commits.stdout)
        .trim()
        .parse::<u32>()
        .expect("git rev-list --count should output a valid number");

    let first_commit_date = std::process::Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .arg("log")
        .arg("-1")
        .arg("--reverse")
        .arg("--format=%ad")
        .arg("--date=format:%Y-%m-%d")
        .output()
        .expect("git should be installed and able to get first commit date");
    let first_commit_date = String::from_utf8_lossy(&first_commit_date.stdout)
        .trim()
        .to_string();

    let last_commit_date = std::process::Command::new("git")
        .arg("-C")
        .arg(&repo_path)
        .arg("log")
        .arg("-1")
        .arg("--format=%ad")
        .arg("--date=format:%Y-%m-%d")
        .output()
        .expect("git should be installed and able to get last commit date");
    let last_commit_date = String::from_utf8_lossy(&last_commit_date.stdout)
        .trim()
        .to_string();

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
