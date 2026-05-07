use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Package {
    pub name: String,
    pub description: String,
    pub version: String,
    pub installed_version: Option<String>,
    pub size: u64,
    pub installed_size: Option<u64>,
    pub repository: String,
    pub maintainer: String,
    pub homepage: Option<String>,
    pub license: Option<String>,
    pub dependencies: Vec<String>,
    pub reverse_dependencies: Vec<String>,
    pub installed_date: Option<String>,
    pub is_installed: bool,
    pub is_upgradable: bool,
    pub is_held: bool,
    pub popularity: Option<f64>,
    pub category: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PackageManagerType {
    Apt,
    Pacman,
    Yay,
    Paru,
}

impl std::fmt::Display for PackageManagerType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PackageManagerType::Apt => write!(f, "apt"),
            PackageManagerType::Pacman => write!(f, "pacman"),
            PackageManagerType::Yay => write!(f, "yay"),
            PackageManagerType::Paru => write!(f, "paru"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub command: String,
    pub output: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub selected_manager: Option<String>,
    pub remember_manager: bool,
    pub theme: String,
    pub auto_refresh_interval: u64,
    pub last_refresh: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageHistoryEntry {
    pub timestamp: String,
    pub action: String,
    pub old_version: Option<String>,
    pub new_version: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            selected_manager: None,
            remember_manager: false,
            theme: "dark".to_string(),
            auto_refresh_interval: 0,
            last_refresh: None,
        }
    }
}
