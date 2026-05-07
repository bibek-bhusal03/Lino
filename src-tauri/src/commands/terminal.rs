use tauri::command;
use tauri::Emitter;
use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalLine {
    line: String,
    is_error: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalResult {
    pub success: bool,
    pub exit_code: i32,
}

#[command]
pub async fn run_command_live(
    app: tauri::AppHandle,
    program: &str,
    args: Vec<String>,
    use_sudo: bool,
) -> Result<TerminalResult, String> {
    use tokio::io::{AsyncBufReadExt, BufReader};

    let full_command = if use_sudo {
        format!("pkexec {} {}", program, args.join(" "))
    } else {
        format!("{} {}", program, args.join(" "))
    };

    let (cmd_name, cmd_args) = if use_sudo {
        let mut a = vec![program.to_string()];
        a.extend(args);
        ("pkexec".to_string(), a)
    } else {
        (program.to_string(), args)
    };

    app.emit("terminal_output", TerminalLine {
        line: format!("$ {}", full_command),
        is_error: false,
    }).map_err(|e| e.to_string())?;

    let mut child = tokio::process::Command::new(&cmd_name)
        .args(&cmd_args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn command: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    let mut stdout_reader = BufReader::new(stdout).lines();
    let mut stderr_reader = BufReader::new(stderr).lines();

    let mut stdout_done = false;
    let mut stderr_done = false;

    loop {
        if stdout_done && stderr_done {
            break;
        }

        if !stdout_done && !stderr_done {
            tokio::select! {
                result = stdout_reader.next_line() => {
                    match result {
                        Ok(Some(line)) => {
                            app.emit("terminal_output", TerminalLine {
                                line,
                                is_error: false,
                            }).map_err(|e| e.to_string())?;
                        }
                        Ok(None) => { stdout_done = true; }
                        Err(e) => {
                            app.emit("terminal_output", TerminalLine {
                                line: format!("Error reading stdout: {}", e),
                                is_error: true,
                            }).map_err(|e| e.to_string())?;
                            stdout_done = true;
                        }
                    }
                }
                result = stderr_reader.next_line() => {
                    match result {
                        Ok(Some(line)) => {
                            app.emit("terminal_output", TerminalLine {
                                line,
                                is_error: true,
                            }).map_err(|e| e.to_string())?;
                        }
                        Ok(None) => { stderr_done = true; }
                        Err(e) => {
                            app.emit("terminal_output", TerminalLine {
                                line: format!("Error reading stderr: {}", e),
                                is_error: true,
                            }).map_err(|e| e.to_string())?;
                            stderr_done = true;
                        }
                    }
                }
            }
        } else if !stdout_done {
            match stdout_reader.next_line().await {
                Ok(Some(line)) => {
                    app.emit("terminal_output", TerminalLine {
                        line,
                        is_error: false,
                    }).map_err(|e| e.to_string())?;
                }
                _ => { stdout_done = true; }
            }
        } else if !stderr_done {
            match stderr_reader.next_line().await {
                Ok(Some(line)) => {
                    app.emit("terminal_output", TerminalLine {
                        line,
                        is_error: true,
                    }).map_err(|e| e.to_string())?;
                }
                _ => { stderr_done = true; }
            }
        }
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait for command: {}", e))?;

    let exit_code = status.code().unwrap_or(-1);
    let success = status.success();

    app.emit("terminal_output", TerminalLine {
        line: if success {
            "Command completed successfully.".to_string()
        } else {
            format!("Command failed with exit code: {}", exit_code)
        },
        is_error: !success,
    }).map_err(|e| e.to_string())?;

    Ok(TerminalResult { success, exit_code })
}
