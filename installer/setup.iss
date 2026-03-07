; Inno Setup Script for Roblox Studio MCP
; Installs: Plugin (.rbxmx), Studio Capture binary, FFmpeg

#define AppName "Roblox Studio MCP"
#define AppVersion "1.0.0"
#define AppPublisher "Roblox Studio MCP"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
OutputBaseFilename=RobloxStudioMCP-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest

[Files]
; Plugin file
Source: "build\StudioBridgeMCP.rbxmx"; DestDir: "{localappdata}\Roblox\Plugins"; Flags: ignoreversion

; Capture binary
Source: "build\studio-capture.exe"; DestDir: "{app}\bin"; Flags: ignoreversion

; FFmpeg (if bundled)
Source: "build\ffmpeg.exe"; DestDir: "{app}\bin"; Flags: ignoreversion; Check: not FFmpegExists

[Run]
; Configure Claude Code MCP settings
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\configure-mcp.ps1"""; StatusMsg: "Configuring MCP clients..."; Flags: runhidden

[Code]
function FFmpegExists(): Boolean;
begin
  Result := FileExists(ExpandConstant('{app}\bin\ffmpeg.exe'));
  if not Result then
  begin
    // Also check PATH
    Result := FileSearch('ffmpeg.exe', GetEnv('PATH')) <> '';
  end;
end;

[Dirs]
Name: "{app}\bin"
Name: "{app}\scripts"

[Files]
Source: "scripts\configure-mcp.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
