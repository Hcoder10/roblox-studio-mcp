# Configure MCP clients for Roblox Studio MCP

$ErrorActionPreference = "Stop"

$installDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$captureBin = Join-Path $installDir "bin\studio-capture.exe"

# Cloud MCP server URL
$cloudServerUrl = "https://roblox-studio-mcp.up.railway.app"

# Configure Claude Code (if installed)
$claudeConfigDir = Join-Path $env:USERPROFILE ".claude"
$claudeConfigFile = Join-Path $claudeConfigDir "claude_desktop_config.json"

if (Test-Path (Join-Path $claudeConfigDir "..")) {
    if (-not (Test-Path $claudeConfigDir)) {
        New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
    }

    $config = @{}
    if (Test-Path $claudeConfigFile) {
        $config = Get-Content $claudeConfigFile -Raw | ConvertFrom-Json -AsHashtable
    }

    if (-not $config.ContainsKey("mcpServers")) {
        $config["mcpServers"] = @{}
    }

    # Add cloud MCP server (Streamable HTTP)
    $config["mcpServers"]["roblox-studio"] = @{
        "url" = "$cloudServerUrl/mcp"
        "transport" = "streamable-http"
    }

    # Add local capture binary (stdio)
    $config["mcpServers"]["studio-capture"] = @{
        "command" = $captureBin
        "transport" = "stdio"
    }

    $config | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigFile -Encoding UTF8
    Write-Host "Configured Claude Code MCP servers"
}

# Configure Cursor (if installed)
$cursorConfigDir = Join-Path $env:APPDATA "Cursor"
$cursorMcpFile = Join-Path $cursorConfigDir "mcp.json"

if (Test-Path $cursorConfigDir) {
    $mcpConfig = @{ "mcpServers" = @{} }
    if (Test-Path $cursorMcpFile) {
        $mcpConfig = Get-Content $cursorMcpFile -Raw | ConvertFrom-Json -AsHashtable
    }

    $mcpConfig["mcpServers"]["roblox-studio"] = @{
        "url" = "$cloudServerUrl/mcp"
        "transport" = "streamable-http"
    }

    $mcpConfig["mcpServers"]["studio-capture"] = @{
        "command" = $captureBin
        "transport" = "stdio"
    }

    $mcpConfig | ConvertTo-Json -Depth 10 | Set-Content $cursorMcpFile -Encoding UTF8
    Write-Host "Configured Cursor MCP servers"
}

Write-Host ""
Write-Host "MCP configuration complete!"
Write-Host "Cloud server: $cloudServerUrl"
Write-Host "Capture binary: $captureBin"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Open Roblox Studio - the plugin should appear in the Plugins tab"
Write-Host "2. Click 'Connect' in the plugin to connect to the cloud server"
Write-Host "3. Open Claude Code or Cursor - the MCP tools should be available"
