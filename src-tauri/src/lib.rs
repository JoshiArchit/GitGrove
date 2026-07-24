// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod contributions;
mod scanner;
use contributions::get_contributions;
use scanner::scan_repos;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![scan_repos, get_contributions])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
