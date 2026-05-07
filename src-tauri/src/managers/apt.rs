use crate::models::{Package, ExecutionResult};
use crate::utils::run_command;

pub fn refresh_database() -> ExecutionResult {
    run_command("apt", &["update"], true)
}

pub fn list_packages() -> Vec<Package> {
    let result = run_command("dpkg-query", &["-W", "-f=${Package}\\n"], false);
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
    let result = run_command("dpkg", &["-s", name], false);
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
        if trimmed.starts_with("Package:") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.name = val.trim().to_string();
            }
        } else if trimmed.starts_with("Version:") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.version = val.trim().to_string();
                package.installed_version = Some(package.version.clone());
            }
        } else if trimmed.starts_with("Description:") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.description = val.trim().to_string();
            }
        } else if trimmed.starts_with("Maintainer:") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.maintainer = val.trim().to_string();
            }
        } else if trimmed.starts_with("Installed-Size:") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                if let Ok(size) = val.trim().parse::<u64>() {
                    package.installed_size = Some(size * 1024);
                }
            }
        } else if trimmed.starts_with("Depends:") {
            if let Some(val) = trimmed.splitn(2, ':').nth(1) {
                package.dependencies = val
                    .trim()
                    .split(',')
                    .map(|d| d.split_whitespace().next().unwrap_or("").trim().to_string())
                    .filter(|d| !d.is_empty())
                    .collect();
            }
        }
    }

    Some(package)
}

pub fn get_package_info_raw(name: &str) -> Option<String> {
    let result = run_command("dpkg", &["-s", name], false);
    if result.success {
        Some(result.output)
    } else {
        None
    }
}

pub fn get_package_info_raw_available(name: &str) -> Option<String> {
    let result = run_command("apt-cache", &["show", name], false);
    if result.success {
        Some(result.output)
    } else {
        None
    }
}

pub fn search_packages(query: &str, max_results: usize) -> Vec<Package> {
    let result = run_command("apt-cache", &["search", query], false);
    if !result.success {
        return Vec::new();
    }

    let installed_result = run_command("dpkg-query", &["-W", "-f=${Package}\\n"], false);
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

    for line in result.output.lines().filter(|line| !line.is_empty()) {
        if packages.len() >= max_results {
            break;
        }

        let sep_pos = match line.find(" - ") {
            Some(pos) => pos,
            None => continue,
        };
        let name = line[..sep_pos].trim().to_string();
        let description = line[sep_pos + 3..].trim().to_string();
        let is_installed = installed.iter().any(|n| n == &name);

        packages.push(Package {
            name,
            description,
            version: String::new(),
            installed_version: None,
            size: 0,
            installed_size: None,
            repository: "apt".to_string(),
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
    let result = run_command("apt", &["list", "--upgradable"], false);
    if !result.success {
        return Vec::new();
    }

    result
        .output
        .lines()
        .filter(|line| !line.is_empty() && !line.starts_with("Listing"))
        .filter_map(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                Some(Package {
                    name: parts[0].split('/').next().unwrap_or("").to_string(),
                    description: String::new(),
                    version: parts.get(1).unwrap_or(&"").to_string(),
                    installed_version: None,
                    size: 0,
                    installed_size: None,
                    repository: "apt".to_string(),
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
    run_command("apt", &["install", "-y", name], true)
}

pub fn remove_package(name: &str, purge: bool) -> ExecutionResult {
    if purge {
        run_command("apt", &["remove", "--purge", "-y", name], true)
    } else {
        run_command("apt", &["remove", "-y", name], true)
    }
}

pub fn upgrade_package(name: &str) -> ExecutionResult {
    run_command("apt", &["install", "--only-upgrade", "-y", name], true)
}

pub fn full_upgrade() -> ExecutionResult {
    run_command("apt", &["upgrade", "-y"], true)
}

pub fn clean_cache() -> ExecutionResult {
    run_command("apt", &["clean"], true)
}
