# Lino

A fast, modern Linux package manager with a native-feeling desktop UI. Built with Tauri, React, and Rust.

![Platform](https://img.shields.io/badge/platform-Linux-lightgrey)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Multi-manager support** — pacman, AUR helpers (yay, paru), and apt
- **Search & browse** — Fast package search with rich details (description, version, dependencies, size, etc.)
- **Install, remove & upgrade** — Per-package or bulk operations with PolKit authentication
- **System maintenance** — Database refresh, full system upgrade, cache cleanup, orphan detection & removal
- **Package history** — View install/upgrade/remove timeline from pacman logs
- **Clean, minimal UI** — Dark theme with responsive sidebar, detail panel, and inline actions

## Screenshots

<!-- Add screenshots here -->

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, TailwindCSS v4 |
| **State** | Zustand |
| **Backend** | Rust, Tokio (async runtime) |
| **Desktop** | Tauri v2 |
| **Build** | Vite |

## Supported Package Managers

| Manager | Distro | Install | Remove | Search | Upgrades | AUR |
|---------|--------|---------|--------|--------|----------|-----|
| **pacman** | Arch Linux | Yes | Yes | Yes | Yes | No |
| **yay** | Arch Linux | Yes | Yes | Yes | Yes | Yes |
| **paru** | Arch Linux | Yes | Yes | Yes | Yes | Yes |
| **apt** | Debian/Ubuntu | Yes | Yes | Yes | Yes | No |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (latest stable)
- Tauri dependencies (Linux): `build-essential curl libssl-dev pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev`

See [Tauri Linux Prerequisites](https://tauri.app/start/prerequisites/#linux) for details.

## Getting Started

```bash
# Clone the repository
git clone git@github.com:bibek-bhusal03/Lino.git
cd Lino

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure

```
├── src/                          # React frontend
│   ├── components/
│   │   ├── layout/               # Sidebar, TopBar, DetailPanel
│   │   ├── packages/             # PackageList, SearchBar, SearchTab
│   │   ├── settings/             # SettingsModal
│   │   └── ui/                   # Toast, TerminalPanel
│   └── store/                    # Zustand state management
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── commands/             # Tauri invoke handlers
│   │   │   ├── packages.rs       # List, search, install, remove, upgrade
│   │   │   ├── system.rs         # Refresh, full upgrade, clean, orphans
│   │   │   ├── config.rs         # App configuration
│   │   │   └── terminal.rs       # Live command streaming
│   │   └── managers/             # Package manager implementations
│   │       ├── apt.rs
│   │       ├── pacman.rs
│   │       ├── yay.rs
│   │       └── paru.rs
│   └── tauri.conf.json
```

## Roadmap

- [ ] Flatpak & Snap support
- [ ] Package group management
- [ ] Live terminal output for long-running operations
- [ ] Dark/Light theme toggle
- [ ] Export package list
- [ ] Auto-update notifications

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

## License

MIT — see [LICENSE](LICENSE) for details.
