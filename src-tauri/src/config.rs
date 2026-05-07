use std::fs;
use std::path::PathBuf;
use crate::models::AppConfig;

fn get_config_path() -> PathBuf {
    let config_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    config_dir.join("lino").join("config.json")
}

pub fn load_config() -> AppConfig {
    let path = get_config_path();
    if path.exists() {
        match fs::read_to_string(&path) {
            Ok(contents) => {
                match serde_json::from_str(&contents) {
                    Ok(config) => config,
                    Err(_) => AppConfig::default(),
                }
            }
            Err(_) => AppConfig::default(),
        }
    } else {
        AppConfig::default()
    }
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = get_config_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let contents = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(&path, contents).map_err(|e| e.to_string())
}
