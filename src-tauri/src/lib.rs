mod models;
mod managers;
mod commands;
mod config;
mod utils;

use commands::{packages, system, config as config_commands, terminal};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            packages::list_packages,
            packages::search_packages,
            packages::get_package_info,
            packages::get_package_info_raw,
            packages::get_package_info_raw_available,
            packages::get_upgradable_packages,
            packages::install_package,
            packages::remove_package,
            packages::upgrade_package,
            packages::bulk_install,
            packages::bulk_remove,
            packages::bulk_upgrade,
            packages::get_package_history,
            system::refresh_database,
            system::full_upgrade,
            system::clean_cache,
            system::get_orphaned_packages,
            system::remove_orphans,
            config_commands::get_config,
            config_commands::save_config,
            terminal::run_command_live,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
