use tauri::command;
use crate::models::ExecutionResult;
use crate::managers;

#[command]
pub async fn refresh_database(manager: &str) -> Result<ExecutionResult, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::refresh_database(),
            "pacman" => managers::pacman::refresh_database(),
            "yay" => managers::yay::refresh_database(),
            "paru" => managers::paru::refresh_database(),
            _ => ExecutionResult {
                success: false,
                command: String::new(),
                output: String::new(),
                error: Some("Unknown package manager".to_string()),
            },
        }
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn full_upgrade(manager: &str) -> Result<ExecutionResult, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::full_upgrade(),
            "pacman" => managers::pacman::full_upgrade(),
            "yay" => managers::yay::full_upgrade(),
            "paru" => managers::paru::full_upgrade(),
            _ => ExecutionResult {
                success: false,
                command: String::new(),
                output: String::new(),
                error: Some("Unknown package manager".to_string()),
            },
        }
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn clean_cache(manager: &str) -> Result<ExecutionResult, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::clean_cache(),
            "pacman" => managers::pacman::clean_cache(),
            "yay" => managers::yay::clean_cache(),
            "paru" => managers::paru::clean_cache(),
            _ => ExecutionResult {
                success: false,
                command: String::new(),
                output: String::new(),
                error: Some("Unknown package manager".to_string()),
            },
        }
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn get_orphaned_packages(manager: &str) -> Result<Vec<String>, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "pacman" | "yay" | "paru" => managers::pacman::get_orphaned_packages(),
            _ => Vec::new(),
        }
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn remove_orphans(manager: &str) -> Result<ExecutionResult, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "pacman" => managers::pacman::remove_orphans(),
            "yay" => managers::yay::remove_package("$(pacman -Qdtq)", true),
            "paru" => managers::paru::remove_package("$(pacman -Qdtq)", true),
            _ => ExecutionResult {
                success: false,
                command: String::new(),
                output: String::new(),
                error: Some("Unknown package manager".to_string()),
            },
        }
    })
    .await
    .map_err(|e| e.to_string())
}
