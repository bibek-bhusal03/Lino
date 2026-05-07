use crate::models::{Package, ExecutionResult, PackageHistoryEntry};
use crate::utils::run_command;

pub fn refresh_database() -> ExecutionResult {
    run_command("pacman", &["-Sy"], true)
}

pub fn list_packages() -> Vec<Package> {
    let result = run_command("pacman", &["-Qq"], false);
    if !result.success {
        return Vec::new();
    }

    result
        .output
        .lines()
        .filter(|line| !line.is_empty())
        .map(|line| Package {
            name: line.trim().to_string(),
            description: String::new(),
            version: String::new(),
            installed_version: None,
            size: 0,
            installed_size: None,
            repository: "local".to_string(),
            maintainer: String::new(),
            homepage: None,
            license: None,
            dependencies: Vec::new(),
            reverse_dependencies: Vec::new(),
            installed_date: None,
            is_installed: true,
            is_upgradable: false,
            is_held: false,
            popularity: None,
            category: None,
        })
        .collect()
}

pub fn get_package_info(name: &str) -> Option<Package> {
    let result = run_command("pacman", &["-Qi", name], false);
    if !result.success {
        return None;
    }

    let mut package = Package {
        name: name.to_string(),
        description: String::new(),
        version: String::new(),
        installed_version: None,
        size: 0,
        installed_size: None,
        repository: "local".to_string(),
        maintainer: String::new(),
        homepage: None,
        license: None,
        dependencies: Vec::new(),
        reverse_dependencies: Vec::new(),
        installed_date: None,
        is_installed: true,
        is_upgradable: false,
        is_held: false,
        popularity: None,
        category: None,
    };

    for line in result.output.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("Name") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.name = val.trim().to_string();
            }
        } else if trimmed.starts_with("Version") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.version = val.trim().to_string();
                package.installed_version = Some(package.version.clone());
            }
        } else if trimmed.starts_with("Description") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.description = val.trim().to_string();
            }
        } else if trimmed.starts_with("Packager") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.maintainer = val.trim().to_string();
            }
        } else if trimmed.starts_with("URL") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.homepage = Some(val.trim().to_string());
            }
        } else if trimmed.starts_with("Licenses") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                let val = val.trim();
                if val != "None" {
                    package.license = Some(val.to_string());
                }
            }
        } else if trimmed.starts_with("Installed Size") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                let val = val.trim();
                if let Some(num_str) = val.split_whitespace().next() {
                    if let Ok(size) = num_str.parse::<u64>() {
                        package.installed_size = Some(size * 1024);
                    }
                }
            }
        } else if trimmed.starts_with("Install Date") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                let val = val.trim();
                if !val.is_empty() {
                    package.installed_date = Some(val.to_string());
                }
            }
        } else if trimmed.starts_with("Depends On") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.dependencies = val
                    .trim()
                    .split_whitespace()
                    .map(|s| s.to_string())
                    .collect();
            }
        } else if trimmed.starts_with("Required By") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.reverse_dependencies = val
                    .trim()
                    .split_whitespace()
                    .map(|s| s.to_string())
                    .collect();
            }
        } else if trimmed.starts_with("Install Reason") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.category = Some(val.trim().to_string());
            }
        }
    }

    Some(package)
}

pub fn get_package_info_raw(name: &str) -> Option<String> {
    let result = run_command("pacman", &["-Qi", name], false);
    if result.success {
        Some(result.output)
    } else {
        None
    }
}

pub fn get_package_info_raw_available(name: &str) -> Option<String> {
    let result = run_command("pacman", &["-Si", name], false);
    if result.success {
        Some(result.output)
    } else {
        None
    }
}

pub fn search_packages(query: &str, max_results: usize) -> Vec<Package> {
    let result = run_command("pacman", &["-Ss", query], false);
    if !result.success {
        return Vec::new();
    }

    let installed_result = run_command("pacman", &["-Qq"], false);
    let installed: Vec<String> = if installed_result.success {
        installed_result
            .output
            .lines()
            .filter(|l| !l.is_empty())
            .map(|l| l.to_string())
            .collect()
    } else {
        Vec::new()
    };

    let mut packages: Vec<Package> = Vec::new();
    let mut lines = result.output.lines().peekable();

    while let Some(line) = lines.next() {
        if packages.len() >= max_results {
            break;
        }

        let trimmed = line.trim();
        if !trimmed.contains('/') {
            continue;
        }

        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        let name_repo = parts[0];
        let repo = name_repo.split('/').next().unwrap_or("unknown");
        let name_with_version = name_repo.split('/').nth(1).unwrap_or("");
        let name = name_with_version.split_whitespace().next().unwrap_or(name_with_version);
        if name.is_empty() {
            continue;
        }

        let version = parts.get(1).map(|s| s.to_string()).unwrap_or_default();

        let mut description = String::new();
        while let Some(next_line) = lines.peek() {
            let next_trimmed = next_line.trim();
            if next_trimmed.contains('/') {
                break;
            }
            if !next_trimmed.is_empty() {
                description = next_trimmed.to_string();
            }
            lines.next();
        }

        let is_installed = installed.iter().any(|n| n == name);

        packages.push(Package {
            name: name.to_string(),
            description,
            version,
            installed_version: if is_installed { Some(parts.get(1).unwrap_or(&"").to_string()) } else { None },
            size: 0,
            installed_size: None,
            repository: repo.to_string(),
            maintainer: String::new(),
            homepage: None,
            license: None,
            dependencies: Vec::new(),
            reverse_dependencies: Vec::new(),
            installed_date: None,
            is_installed,
            is_upgradable: false,
            is_held: false,
            popularity: None,
            category: None,
        });
    }

    packages
}

pub fn get_upgradable_packages() -> Vec<Package> {
    let result = run_command("pacman", &["-Qu"], false);
    if !result.success {
        return Vec::new();
    }

    result
        .output
        .lines()
        .filter(|line| !line.is_empty())
        .filter_map(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                Some(Package {
                    name: parts[0].to_string(),
                    description: String::new(),
                    version: parts[1].to_string(),
                    installed_version: None,
                    size: 0,
                    installed_size: None,
                    repository: "pacman".to_string(),
                    maintainer: String::new(),
                    homepage: None,
                    license: None,
                    dependencies: Vec::new(),
                    reverse_dependencies: Vec::new(),
                    installed_date: None,
                    is_installed: true,
                    is_upgradable: true,
                    is_held: false,
                    popularity: None,
                    category: None,
                })
            } else {
                None
            }
        })
        .collect()
}

pub fn install_package(name: &str) -> ExecutionResult {
    run_command("pacman", &["-S", "--noconfirm", name], true)
}

pub fn remove_package(name: &str, recursive: bool) -> ExecutionResult {
    if recursive {
        run_command("pacman", &["-Rsc", "--noconfirm", name], true)
    } else {
        run_command("pacman", &["-R", "--noconfirm", name], true)
    }
}

pub fn upgrade_package(name: &str) -> ExecutionResult {
    run_command("pacman", &["-S", "--noconfirm", name], true)
}

pub fn full_upgrade() -> ExecutionResult {
    run_command("pacman", &["-Syu", "--noconfirm"], true)
}

pub fn clean_cache() -> ExecutionResult {
    run_command("pacman", &["-Sc", "--noconfirm"], true)
}

pub fn get_orphaned_packages() -> Vec<String> {
    let result = run_command("pacman", &["-Qdtq"], false);
    if !result.success {
        return Vec::new();
    }

    result
        .output
        .lines()
        .filter(|line| !line.is_empty())
        .map(|line| line.to_string())
        .collect()
}

pub fn remove_orphans() -> ExecutionResult {
    run_command("pacman", &["-Rns", "--noconfirm", "$(pacman -Qdtq)"], true)
}

pub fn get_package_history(name: &str) -> Vec<PackageHistoryEntry> {
    let log_path = "/var/log/pacman.log";
    let content = match std::fs::read_to_string(log_path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let mut entries = Vec::new();
    let search_pattern = format!(" {}", name);

    for line in content.lines().rev() {
        if !line.contains(&search_pattern) && !line.contains(&format!(" {} ", name)) {
            continue;
        }

        if let Some(entry) = parse_pacman_log_line(line, name) {
            entries.push(entry);
            if entries.len() >= 50 {
                break;
            }
        }
    }

    entries.reverse();
    entries
}

fn parse_pacman_log_line(line: &str, _name: &str) -> Option<PackageHistoryEntry> {
    let timestamp = extract_timestamp(line)?;
    let action = extract_action(line)?;
    let (old_version, new_version) = extract_versions(line, &action);

    Some(PackageHistoryEntry {
        timestamp,
        action,
        old_version,
        new_version,
    })
}

fn extract_timestamp(line: &str) -> Option<String> {
    let start = line.find('[')?;
    let end = line.find(']')?;
    if start < end {
        Some(line[start + 1..end].to_string())
    } else {
        None
    }
}

fn extract_action(line: &str) -> Option<String> {
    if line.contains(" installed ") {
        Some("installed".to_string())
    } else if line.contains(" upgraded ") {
        Some("upgraded".to_string())
    } else if line.contains(" removed ") {
        Some("removed".to_string())
    } else if line.contains(" reinstalling ") {
        Some("reinstalled".to_string())
    } else if line.contains(" downgraded ") {
        Some("downgraded".to_string())
    } else {
        None
    }
}

fn extract_versions(line: &str, action: &str) -> (Option<String>, Option<String>) {
    match action {
        "installed" | "reinstalled" => {
            if let Some(ver) = extract_version_after_package(line) {
                (None, Some(ver))
            } else {
                (None, None)
            }
        }
        "removed" => {
            if let Some(ver) = extract_version_after_package(line) {
                (Some(ver), None)
            } else {
                (None, None)
            }
        }
        "upgraded" | "downgraded" => {
            extract_upgrade_versions(line)
        }
        _ => (None, None),
    }
}

fn extract_version_after_package(line: &str) -> Option<String> {
    let paren_start = line.rfind('(')?;
    let paren_end = line.rfind(')')?;
    if paren_start < paren_end {
        Some(line[paren_start + 1..paren_end].to_string())
    } else {
        None
    }
}

fn extract_upgrade_versions(line: &str) -> (Option<String>, Option<String>) {
    if let Some(paren_start) = line.rfind('(') {
        if let Some(paren_end) = line.rfind(')') {
            if paren_start < paren_end {
                let version_str = &line[paren_start + 1..paren_end];
                if let Some(dash_pos) = version_str.find(" -> ") {
                    let old = version_str[..dash_pos].trim().to_string();
                    let new = version_str[dash_pos + 4..].trim().to_string();
                    return (Some(old), Some(new));
                }
            }
        }
    }
    (None, None)
}
