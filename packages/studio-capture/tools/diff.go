package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"github.com/roblox-studio-mcp/studio-capture/internal/diff"
)

// ScreenshotDiffTool returns the tool definition for screenshot_diff.
func ScreenshotDiffTool() mcp.Tool {
	return mcp.NewTool("screenshot_diff",
		mcp.WithDescription("Compare two screenshots and highlight differences"),
		mcp.WithString("image_a_base64",
			mcp.Required(),
			mcp.Description("First image as base64-encoded PNG or JPEG"),
		),
		mcp.WithString("image_b_base64",
			mcp.Required(),
			mcp.Description("Second image as base64-encoded PNG or JPEG"),
		),
		mcp.WithNumber("threshold",
			mcp.Description("Pixel difference threshold (0-255, default 10)"),
		),
	)
}

// ScreenshotDiffHandler handles screenshot_diff requests.
func ScreenshotDiffHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	imageA, ok := request.Params.Arguments["image_a_base64"].(string)
	if !ok || imageA == "" {
		return mcp.NewToolResultError("image_a_base64 is required"), nil
	}

	imageB, ok := request.Params.Arguments["image_b_base64"].(string)
	if !ok || imageB == "" {
		return mcp.NewToolResultError("image_b_base64 is required"), nil
	}

	threshold := 10
	if t, ok := request.Params.Arguments["threshold"].(float64); ok && t > 0 {
		threshold = int(t)
	}

	result, err := diff.CompareImages(imageA, imageB, threshold)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Diff failed: %v", err)), nil
	}

	regionsJSON, _ := json.Marshal(result.Regions)

	return mcp.NewToolResultText(fmt.Sprintf(
		`{"diff_image_base64": "%s", "diff_percentage": %.2f, "regions": %s}`,
		result.DiffImageBase64, result.DiffPercentage, string(regionsJSON),
	)), nil
}

// RegisterDiffTools registers the diff tool with the MCP server.
func RegisterDiffTools(s *server.MCPServer) {
	s.AddTool(ScreenshotDiffTool(), ScreenshotDiffHandler)
}
