// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod contributions;
mod scanner;
mod summary;
use contributions::get_contributions;
use scanner::get_repo_from_path;
use scanner::scan_repos;
use summary::get_repo_summary;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_repos,
            get_repo_from_path,
            get_contributions,
            get_repo_summary
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
