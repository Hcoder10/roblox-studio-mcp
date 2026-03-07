package diff

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	_ "image/jpeg"
	"image/png"
	"math"
)

// Region represents a bounding box of a changed area.
type Region struct {
	X int `json:"x"`
	Y int `json:"y"`
	W int `json:"w"`
	H int `json:"h"`
}

// DiffResult holds the result of comparing two images.
type DiffResult struct {
	DiffImageBase64 string   `json:"diff_image_base64"`
	DiffPercentage  float64  `json:"diff_percentage"`
	Regions         []Region `json:"regions"`
}

// CompareImages compares two base64-encoded images and returns the diff.
func CompareImages(imageABase64, imageBBase64 string, threshold int) (*DiffResult, error) {
	if threshold <= 0 {
		threshold = 10
	}
	if threshold > 255 {
		threshold = 255
	}

	imgA, err := decodeBase64Image(imageABase64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image A: %w", err)
	}

	imgB, err := decodeBase64Image(imageBBase64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image B: %w", err)
	}

	boundsA := imgA.Bounds()
	boundsB := imgB.Bounds()

	width := boundsA.Dx()
	height := boundsA.Dy()

	if boundsA.Dx() != boundsB.Dx() || boundsA.Dy() != boundsB.Dy() {
		// Use the larger dimensions
		if boundsB.Dx() > width {
			width = boundsB.Dx()
		}
		if boundsB.Dy() > height {
			height = boundsB.Dy()
		}
	}

	diffImg := image.NewRGBA(image.Rect(0, 0, width, height))
	diffMask := make([]bool, width*height)
	diffCount := 0
	totalPixels := width * height

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			var cA, cB color.RGBA

			if x < boundsA.Dx() && y < boundsA.Dy() {
				r, g, b, a := imgA.At(x+boundsA.Min.X, y+boundsA.Min.Y).RGBA()
				cA = color.RGBA{uint8(r >> 8), uint8(g >> 8), uint8(b >> 8), uint8(a >> 8)}
			}

			if x < boundsB.Dx() && y < boundsB.Dy() {
				r, g, b, a := imgB.At(x+boundsB.Min.X, y+boundsB.Min.Y).RGBA()
				cB = color.RGBA{uint8(r >> 8), uint8(g >> 8), uint8(b >> 8), uint8(a >> 8)}
			}

			diff := pixelDiff(cA, cB)
			if diff > threshold {
				// Mark as different — red highlight
				diffImg.SetRGBA(x, y, color.RGBA{255, 0, 0, 180})
				diffMask[y*width+x] = true
				diffCount++
			} else {
				// Dim the original pixel
				diffImg.SetRGBA(x, y, color.RGBA{cA.R / 3, cA.G / 3, cA.B / 3, 255})
			}
		}
	}

	// Find regions using grid-based approach
	regions := findRegions(diffMask, width, height)

	// Encode diff image
	var buf bytes.Buffer
	if err := png.Encode(&buf, diffImg); err != nil {
		return nil, fmt.Errorf("failed to encode diff image: %w", err)
	}

	diffPercentage := 0.0
	if totalPixels > 0 {
		diffPercentage = float64(diffCount) / float64(totalPixels) * 100.0
	}

	return &DiffResult{
		DiffImageBase64: base64.StdEncoding.EncodeToString(buf.Bytes()),
		DiffPercentage:  math.Round(diffPercentage*100) / 100,
		Regions:         regions,
	}, nil
}

// pixelDiff computes the maximum channel difference between two colors.
func pixelDiff(a, b color.RGBA) int {
	dr := absDiff(int(a.R), int(b.R))
	dg := absDiff(int(a.G), int(b.G))
	db := absDiff(int(a.B), int(b.B))
	maxDiff := dr
	if dg > maxDiff {
		maxDiff = dg
	}
	if db > maxDiff {
		maxDiff = db
	}
	return maxDiff
}

func absDiff(a, b int) int {
	if a > b {
		return a - b
	}
	return b - a
}

// findRegions uses a grid-based approach to find bounding boxes of changed areas.
func findRegions(mask []bool, width, height int) []Region {
	if width == 0 || height == 0 {
		return nil
	}

	// Divide into grid cells
	cellSize := 32
	gridW := (width + cellSize - 1) / cellSize
	gridH := (height + cellSize - 1) / cellSize
	gridCells := make([]bool, gridW*gridH)

	// Mark grid cells that have any diff pixels
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if mask[y*width+x] {
				gx := x / cellSize
				gy := y / cellSize
				gridCells[gy*gridW+gx] = true
			}
		}
	}

	// Flood fill on grid to find connected regions
	visited := make([]bool, gridW*gridH)
	var regions []Region

	for gy := 0; gy < gridH; gy++ {
		for gx := 0; gx < gridW; gx++ {
			idx := gy*gridW + gx
			if !gridCells[idx] || visited[idx] {
				continue
			}

			// BFS flood fill
			minGX, minGY := gx, gy
			maxGX, maxGY := gx, gy
			queue := []struct{ x, y int }{{gx, gy}}
			visited[idx] = true

			for len(queue) > 0 {
				curr := queue[0]
				queue = queue[1:]

				if curr.x < minGX {
					minGX = curr.x
				}
				if curr.y < minGY {
					minGY = curr.y
				}
				if curr.x > maxGX {
					maxGX = curr.x
				}
				if curr.y > maxGY {
					maxGY = curr.y
				}

				// Check 4 neighbors
				for _, d := range [][2]int{{-1, 0}, {1, 0}, {0, -1}, {0, 1}} {
					nx, ny := curr.x+d[0], curr.y+d[1]
					if nx < 0 || nx >= gridW || ny < 0 || ny >= gridH {
						continue
					}
					nIdx := ny*gridW + nx
					if gridCells[nIdx] && !visited[nIdx] {
						visited[nIdx] = true
						queue = append(queue, struct{ x, y int }{nx, ny})
					}
				}
			}

			// Convert grid coords back to pixel coords
			region := Region{
				X: minGX * cellSize,
				Y: minGY * cellSize,
				W: (maxGX-minGX+1)*cellSize,
				H: (maxGY-minGY+1)*cellSize,
			}
			// Clamp to image bounds
			if region.X+region.W > width {
				region.W = width - region.X
			}
			if region.Y+region.H > height {
				region.H = height - region.Y
			}
			regions = append(regions, region)
		}
	}

	return regions
}

// decodeBase64Image decodes a base64-encoded PNG or JPEG image.
func decodeBase64Image(b64 string) (image.Image, error) {
	data, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		return nil, fmt.Errorf("invalid base64: %w", err)
	}

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	return img, nil
}
