use tauri::command;
use crate::models::AppConfig;
use crate::config;

#[command]
pub fn get_config() -> AppConfig {
    config::load_config()
}

#[command]
pub fn save_config(config: AppConfig) -> Result<(), String> {
    config::save_config(&config)
}
