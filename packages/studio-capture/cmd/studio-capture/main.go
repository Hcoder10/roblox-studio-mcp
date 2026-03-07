package main

import (
	"fmt"
	"os"

	"github.com/mark3labs/mcp-go/server"
	"github.com/roblox-studio-mcp/studio-capture/tools"
)

func main() {
	s := server.NewMCPServer(
		"studio-capture",
		"1.0.0",
		server.WithToolCapabilities(true),
	)

	// Register all 7 tools
	tools.RegisterScreenshotTools(s)  // screenshot_take, screenshot_with_camera, screenshot_get_viewport_bounds
	tools.RegisterVideoTools(s)       // video_record_start, video_record_stop, video_get_status
	tools.RegisterDiffTools(s)        // screenshot_diff

	// Start stdio transport
	if err := server.ServeStdio(s); err != nil {
		fmt.Fprintf(os.Stderr, "studio-capture server error: %v\n", err)
		os.Exit(1)
	}
}
