use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub os:         String,
    pub arch:       String,
    pub version:    String,
    pub is_mobile:  bool,
}

/// Appelable depuis Angular : invoke('get_platform_info')
#[tauri::command]
fn get_platform_info() -> PlatformInfo {
    let os = std::env::consts::OS.to_string();
    PlatformInfo {
        is_mobile: os == "android" || os == "ios",
        os,
        arch:    std::env::consts::ARCH.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    }
}

/// Appelable depuis Angular : invoke('open_external_url', { url })
#[tauri::command]
async fn open_external_url(url: String) -> Result<(), String> {
    tauri_plugin_opener::open_url(&url, None::<&str>).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            get_platform_info,
            open_external_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Katika");
}
