use std::process::Command;
use crate::models::ExecutionResult;

pub fn run_command(program: &str, args: &[&str], use_sudo: bool) -> ExecutionResult {
    let mut cmd = if use_sudo {
        let mut c = Command::new("pkexec");
        c.arg(program);
        c
    } else {
        Command::new(program)
    };

    for arg in args {
        cmd.arg(arg);
    }

    let full_command = if use_sudo {
        format!("pkexec {} {}", program, args.join(" "))
    } else {
        format!("{} {}", program, args.join(" "))
    };

    match cmd.output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let success = output.status.success();

            ExecutionResult {
                success,
                command: full_command,
                output: if stdout.is_empty() { stderr.clone() } else { stdout },
                error: if success { None } else { Some(stderr) },
            }
        }
        Err(e) => ExecutionResult {
            success: false,
            command: full_command,
            output: String::new(),
            error: Some(e.to_string()),
        },
    }
}

#[allow(dead_code)]
pub fn format_bytes(bytes: u64) -> String {
    if bytes < 1024 {
        format!("{} B", bytes)
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else if bytes < 1024 * 1024 * 1024 {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    } else {
        format!("{:.2} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    }
}
