// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod scanner;

use chrono::prelude::*;
use scanner::scan_repos;

#[tauri::command]
fn get_date_time() -> DateTime<Utc> {
    Utc::now()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_date_time, scan_repos])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
