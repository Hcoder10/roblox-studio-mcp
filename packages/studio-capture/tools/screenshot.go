package tools

import (
	"context"
	"encoding/base64"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"github.com/roblox-studio-mcp/studio-capture/internal/capture"
)

// ScreenshotTakeTool returns the tool definition for screenshot_take.
func ScreenshotTakeTool() mcp.Tool {
	return mcp.NewTool("screenshot_take",
		mcp.WithDescription("Capture a screenshot of the Roblox Studio window"),
		mcp.WithString("format",
			mcp.Description("Image format"),
			mcp.Enum("png", "jpeg"),
		),
		mcp.WithNumber("quality",
			mcp.Description("JPEG quality (1-100, default 85)"),
		),
	)
}

// ScreenshotTakeHandler handles screenshot_take requests.
func ScreenshotTakeHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	format := "png"
	if f, ok := request.Params.Arguments["format"].(string); ok && f != "" {
		format = f
	}

	quality := 85
	if q, ok := request.Params.Arguments["quality"].(float64); ok && q > 0 {
		quality = int(q)
	}

	result, err := capture.CaptureStudio(format, quality)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Screenshot failed: %v", err)), nil
	}

	imageB64 := base64.StdEncoding.EncodeToString(result.ImageData)

	return mcp.NewToolResultText(fmt.Sprintf(
		`{"image_base64": "%s", "width": %d, "height": %d, "format": "%s"}`,
		imageB64, result.Width, result.Height, result.Format,
	)), nil
}

// ScreenshotWithCameraTool returns the tool definition for screenshot_with_camera.
func ScreenshotWithCameraTool() mcp.Tool {
	return mcp.NewTool("screenshot_with_camera",
		mcp.WithDescription("Capture screenshot with camera position context (captures current view, camera info is for metadata only)"),
		mcp.WithObject("camera_position",
			mcp.Description("Camera position {x,y,z} - for context only"),
		),
		mcp.WithObject("camera_look_at",
			mcp.Description("Camera look-at target {x,y,z} - for context only"),
		),
	)
}

// ScreenshotWithCameraHandler handles screenshot_with_camera requests.
func ScreenshotWithCameraHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	result, err := capture.CaptureStudio("png", 85)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Screenshot failed: %v", err)), nil
	}

	imageB64 := base64.StdEncoding.EncodeToString(result.ImageData)

	return mcp.NewToolResultText(fmt.Sprintf(
		`{"image_base64": "%s", "width": %d, "height": %d, "note": "Screenshot captured. Camera position/look_at parameters are metadata only - this captures the current Studio viewport. Use the Studio Bridge MCP to move the camera before capturing."}`,
		imageB64, result.Width, result.Height,
	)), nil
}

// ScreenshotGetViewportBoundsTool returns the tool definition for screenshot_get_viewport_bounds.
func ScreenshotGetViewportBoundsTool() mcp.Tool {
	return mcp.NewTool("screenshot_get_viewport_bounds",
		mcp.WithDescription("Get the position and size of the Roblox Studio viewport window"),
	)
}

// ScreenshotGetViewportBoundsHandler handles screenshot_get_viewport_bounds requests.
func ScreenshotGetViewportBoundsHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	bounds, err := capture.GetWindowBounds()
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to get viewport bounds: %v", err)), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf(
		`{"x": %d, "y": %d, "width": %d, "height": %d, "found": %t}`,
		bounds.X, bounds.Y, bounds.Width, bounds.Height, bounds.Found,
	)), nil
}

// RegisterScreenshotTools registers all screenshot tools with the MCP server.
func RegisterScreenshotTools(s *server.MCPServer) {
	s.AddTool(ScreenshotTakeTool(), ScreenshotTakeHandler)
	s.AddTool(ScreenshotWithCameraTool(), ScreenshotWithCameraHandler)
	s.AddTool(ScreenshotGetViewportBoundsTool(), ScreenshotGetViewportBoundsHandler)
}
