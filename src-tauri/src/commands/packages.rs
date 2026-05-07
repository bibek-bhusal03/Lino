use tauri::command;
use crate::models::{Package, ExecutionResult, PackageHistoryEntry};
use crate::managers;

#[command]
pub async fn list_packages(manager: &str) -> Result<Vec<Package>, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::list_packages(),
            "pacman" => managers::pacman::list_packages(),
            "yay" => managers::yay::list_packages(),
            "paru" => managers::paru::list_packages(),
            _ => Vec::new(),
        }
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn search_packages(manager: &str, query: &str) -> Result<Vec<Package>, String> {
    let manager = manager.to_string();
    let query = query.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::search_packages(&query, 100),
            "pacman" => managers::pacman::search_packages(&query, 100),
            "yay" => managers::yay::search_packages(&query, 100),
            "paru" => managers::paru::search_packages(&query, 100),
            _ => Vec::new(),
        }
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn get_package_info(manager: &str, name: &str) -> Result<Option<Package>, String> {
    let manager = manager.to_string();
    let name = name.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::get_package_info(&name),
            "pacman" => managers::pacman::get_package_info(&name),
            "yay" => managers::yay::get_package_info(&name),
            "paru" => managers::paru::get_package_info(&name),
            _ => None,
        }
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn get_package_info_raw(manager: &str, name: &str) -> Result<String, String> {
    let manager = manager.to_string();
    let name = name.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::get_package_info_raw(&name),
            "pacman" => managers::pacman::get_package_info_raw(&name),
            "yay" => managers::yay::get_package_info_raw(&name),
            "paru" => managers::paru::get_package_info_raw(&name),
            _ => None,
        }
    })
    .await
    .map_err(|e| e.to_string())
    .map(|opt| opt.unwrap_or_else(|| "Failed to fetch package info.".to_string()))
}

#[command]
pub async fn get_package_info_raw_available(manager: &str, name: &str) -> Result<String, String> {
    let manager = manager.to_string();
    let name = name.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::get_package_info_raw_available(&name),
            "pacman" => managers::pacman::get_package_info_raw_available(&name),
            "yay" => managers::yay::get_package_info_raw_available(&name),
            "paru" => managers::paru::get_package_info_raw_available(&name),
            _ => None,
        }
    })
    .await
    .map_err(|e| e.to_string())
    .map(|opt| opt.unwrap_or_else(|| "Failed to fetch package info.".to_string()))
}

#[command]
pub async fn get_upgradable_packages(manager: &str) -> Result<Vec<Package>, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::get_upgradable_packages(),
            "pacman" => managers::pacman::get_upgradable_packages(),
            "yay" => managers::yay::get_upgradable_packages(),
            "paru" => managers::paru::get_upgradable_packages(),
            _ => Vec::new(),
        }
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn install_package(manager: &str, name: &str) -> Result<ExecutionResult, String> {
    let manager = manager.to_string();
    let name = name.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::install_package(&name),
            "pacman" => managers::pacman::install_package(&name),
            "yay" => managers::yay::install_package(&name),
            "paru" => managers::paru::install_package(&name),
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
pub async fn remove_package(manager: &str, name: &str, purge: bool) -> Result<ExecutionResult, String> {
    let manager = manager.to_string();
    let name = name.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::remove_package(&name, purge),
            "pacman" => managers::pacman::remove_package(&name, purge),
            "yay" => managers::yay::remove_package(&name, purge),
            "paru" => managers::paru::remove_package(&name, purge),
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
pub async fn upgrade_package(manager: &str, name: &str) -> Result<ExecutionResult, String> {
    let manager = manager.to_string();
    let name = name.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "apt" => managers::apt::upgrade_package(&name),
            "pacman" => managers::pacman::upgrade_package(&name),
            "yay" => managers::yay::upgrade_package(&name),
            "paru" => managers::paru::upgrade_package(&name),
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
pub async fn bulk_install(manager: &str, packages: Vec<String>) -> Result<Vec<ExecutionResult>, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        packages
            .iter()
            .map(|name| {
                match manager.as_str() {
                    "apt" => managers::apt::install_package(name),
                    "pacman" => managers::pacman::install_package(name),
                    "yay" => managers::yay::install_package(name),
                    "paru" => managers::paru::install_package(name),
                    _ => ExecutionResult {
                        success: false,
                        command: String::new(),
                        output: String::new(),
                        error: Some("Unknown package manager".to_string()),
                    },
                }
            })
            .collect()
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn bulk_remove(manager: &str, packages: Vec<String>, purge: bool) -> Result<Vec<ExecutionResult>, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        packages
            .iter()
            .map(|name| {
                match manager.as_str() {
                    "apt" => managers::apt::remove_package(name, purge),
                    "pacman" => managers::pacman::remove_package(name, purge),
                    "yay" => managers::yay::remove_package(name, purge),
                    "paru" => managers::paru::remove_package(name, purge),
                    _ => ExecutionResult {
                        success: false,
                        command: String::new(),
                        output: String::new(),
                        error: Some("Unknown package manager".to_string()),
                    },
                }
            })
            .collect()
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn bulk_upgrade(manager: &str, packages: Vec<String>) -> Result<Vec<ExecutionResult>, String> {
    let manager = manager.to_string();
    tokio::task::spawn_blocking(move || {
        packages
            .iter()
            .map(|name| {
                match manager.as_str() {
                    "apt" => managers::apt::upgrade_package(name),
                    "pacman" => managers::pacman::upgrade_package(name),
                    "yay" => managers::yay::upgrade_package(name),
                    "paru" => managers::paru::upgrade_package(name),
                    _ => ExecutionResult {
                        success: false,
                        command: String::new(),
                        output: String::new(),
                        error: Some("Unknown package manager".to_string()),
                    },
                }
            })
            .collect()
    })
    .await
    .map_err(|e| e.to_string())
}

#[command]
pub async fn get_package_history(manager: &str, name: &str) -> Result<Vec<PackageHistoryEntry>, String> {
    let manager = manager.to_string();
    let name = name.to_string();
    tokio::task::spawn_blocking(move || {
        match manager.as_str() {
            "pacman" | "yay" | "paru" => managers::pacman::get_package_history(&name),
            "apt" => Vec::new(),
            _ => Vec::new(),
        }
    })
    .await
    .map_err(|e| e.to_string())
}
