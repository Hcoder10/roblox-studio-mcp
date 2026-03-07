package capture

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"strings"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	user32 = windows.NewLazySystemDLL("user32.dll")
	gdi32  = windows.NewLazySystemDLL("gdi32.dll")

	procFindWindowW         = user32.NewProc("FindWindowW")
	procEnumWindows         = user32.NewProc("EnumWindows")
	procGetWindowTextW      = user32.NewProc("GetWindowTextW")
	procGetWindowTextLengthW = user32.NewProc("GetWindowTextLengthW")
	procGetWindowRect       = user32.NewProc("GetWindowRect")
	procGetClientRect       = user32.NewProc("GetClientRect")
	procGetDC               = user32.NewProc("GetDC")
	procReleaseDC           = user32.NewProc("ReleaseDC")
	procPrintWindow         = user32.NewProc("PrintWindow")
	procIsWindowVisible     = user32.NewProc("IsWindowVisible")

	procCreateCompatibleDC     = gdi32.NewProc("CreateCompatibleDC")
	procCreateCompatibleBitmap = gdi32.NewProc("CreateCompatibleBitmap")
	procSelectObject           = gdi32.NewProc("SelectObject")
	procBitBlt                 = gdi32.NewProc("BitBlt")
	procDeleteDC               = gdi32.NewProc("DeleteDC")
	procDeleteObject           = gdi32.NewProc("DeleteObject")
	procGetDIBits              = gdi32.NewProc("GetDIBits")
)

const (
	SRCCOPY     = 0x00CC0020
	PW_CLIENTONLY = 0x00000001
	BI_RGB      = 0
	DIB_RGB_COLORS = 0
)

type RECT struct {
	Left, Top, Right, Bottom int32
}

type BITMAPINFOHEADER struct {
	BiSize          uint32
	BiWidth         int32
	BiHeight        int32
	BiPlanes        uint16
	BiBitCount      uint16
	BiCompression   uint32
	BiSizeImage     uint32
	BiXPelsPerMeter int32
	BiYPelsPerMeter int32
	BiClrUsed       uint32
	BiClrImportant  uint32
}

type BITMAPINFO struct {
	BmiHeader BITMAPINFOHEADER
	BmiColors [1]uint32
}

// ViewportBounds represents the position and size of the Roblox Studio window.
type ViewportBounds struct {
	X      int  `json:"x"`
	Y      int  `json:"y"`
	Width  int  `json:"width"`
	Height int  `json:"height"`
	Found  bool `json:"found"`
}

// CaptureResult holds captured screenshot data.
type CaptureResult struct {
	ImageData []byte
	Width     int
	Height    int
	Format    string
}

// FindStudioWindow locates the Roblox Studio window handle.
func FindStudioWindow() (windows.HWND, error) {
	// Try finding by class name first
	className, _ := windows.UTF16PtrFromString("RobloxStudioBeta")
	hwnd, _, _ := procFindWindowW.Call(uintptr(unsafe.Pointer(className)), 0)
	if hwnd != 0 {
		return windows.HWND(hwnd), nil
	}

	// Fallback: enumerate windows and find by title
	var found windows.HWND
	cb := windows.NewCallback(func(hwnd windows.HWND, lparam uintptr) uintptr {
		visible, _, _ := procIsWindowVisible.Call(uintptr(hwnd))
		if visible == 0 {
			return 1 // continue
		}

		textLen, _, _ := procGetWindowTextLengthW.Call(uintptr(hwnd))
		if textLen == 0 {
			return 1
		}

		buf := make([]uint16, textLen+1)
		procGetWindowTextW.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&buf[0])), textLen+1)
		title := windows.UTF16ToString(buf)

		if strings.Contains(title, "Roblox Studio") {
			found = hwnd
			return 0 // stop enumeration
		}
		return 1
	})

	procEnumWindows.Call(cb, 0)
	if found == 0 {
		return 0, fmt.Errorf("Roblox Studio window not found. Make sure Roblox Studio is running")
	}
	return found, nil
}

// GetWindowBounds returns the viewport bounds of the Roblox Studio window.
func GetWindowBounds() (*ViewportBounds, error) {
	hwnd, err := FindStudioWindow()
	if err != nil {
		return &ViewportBounds{Found: false}, nil
	}

	var rect RECT
	ret, _, _ := procGetWindowRect.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&rect)))
	if ret == 0 {
		return &ViewportBounds{Found: false}, fmt.Errorf("failed to get window rect")
	}

	return &ViewportBounds{
		X:      int(rect.Left),
		Y:      int(rect.Top),
		Width:  int(rect.Right - rect.Left),
		Height: int(rect.Bottom - rect.Top),
		Found:  true,
	}, nil
}

// CaptureWindow captures a screenshot of the given window handle.
func CaptureWindow(hwnd windows.HWND, format string, quality int) (*CaptureResult, error) {
	var rect RECT
	ret, _, _ := procGetClientRect.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&rect)))
	if ret == 0 {
		return nil, fmt.Errorf("failed to get client rect")
	}

	width := int(rect.Right - rect.Left)
	height := int(rect.Bottom - rect.Top)

	if width <= 0 || height <= 0 {
		// Fall back to window rect if client rect is empty
		ret, _, _ = procGetWindowRect.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&rect)))
		if ret == 0 {
			return nil, fmt.Errorf("failed to get window rect")
		}
		width = int(rect.Right - rect.Left)
		height = int(rect.Bottom - rect.Top)
		if width <= 0 || height <= 0 {
			return nil, fmt.Errorf("window has zero size (%dx%d)", width, height)
		}
	}

	// Get device context for the window
	hdcWindow, _, _ := procGetDC.Call(uintptr(hwnd))
	if hdcWindow == 0 {
		return nil, fmt.Errorf("failed to get window DC")
	}
	defer procReleaseDC.Call(uintptr(hwnd), hdcWindow)

	// Create compatible DC and bitmap
	hdcMem, _, _ := procCreateCompatibleDC.Call(hdcWindow)
	if hdcMem == 0 {
		return nil, fmt.Errorf("failed to create compatible DC")
	}
	defer procDeleteDC.Call(hdcMem)

	hBitmap, _, _ := procCreateCompatibleBitmap.Call(hdcWindow, uintptr(width), uintptr(height))
	if hBitmap == 0 {
		return nil, fmt.Errorf("failed to create compatible bitmap")
	}
	defer procDeleteObject.Call(hBitmap)

	// Select bitmap into memory DC
	procSelectObject.Call(hdcMem, hBitmap)

	// Try PrintWindow first (works for occluded windows)
	ret, _, _ = procPrintWindow.Call(uintptr(hwnd), hdcMem, PW_CLIENTONLY)
	if ret == 0 {
		// Fallback to BitBlt
		ret, _, _ = procBitBlt.Call(hdcMem, 0, 0, uintptr(width), uintptr(height),
			hdcWindow, 0, 0, SRCCOPY)
		if ret == 0 {
			return nil, fmt.Errorf("failed to capture window (both PrintWindow and BitBlt failed)")
		}
	}

	// Get bitmap bits
	bmi := BITMAPINFO{
		BmiHeader: BITMAPINFOHEADER{
			BiSize:        uint32(unsafe.Sizeof(BITMAPINFOHEADER{})),
			BiWidth:       int32(width),
			BiHeight:      -int32(height), // negative = top-down
			BiPlanes:      1,
			BiBitCount:    32,
			BiCompression: BI_RGB,
		},
	}

	pixelData := make([]byte, width*height*4)
	ret, _, _ = procGetDIBits.Call(hdcMem, hBitmap, 0, uintptr(height),
		uintptr(unsafe.Pointer(&pixelData[0])),
		uintptr(unsafe.Pointer(&bmi)),
		DIB_RGB_COLORS)
	if ret == 0 {
		return nil, fmt.Errorf("failed to get bitmap bits")
	}

	// Convert BGRA to RGBA
	img := bgraToImage(pixelData, width, height)

	// Encode to requested format
	var buf bytes.Buffer
	switch format {
	case "jpeg", "jpg":
		err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
		if err != nil {
			return nil, fmt.Errorf("failed to encode JPEG: %w", err)
		}
		format = "jpeg"
	default:
		err := png.Encode(&buf, img)
		if err != nil {
			return nil, fmt.Errorf("failed to encode PNG: %w", err)
		}
		format = "png"
	}

	return &CaptureResult{
		ImageData: buf.Bytes(),
		Width:     width,
		Height:    height,
		Format:    format,
	}, nil
}

// CaptureStudio finds and captures the Roblox Studio window.
func CaptureStudio(format string, quality int) (*CaptureResult, error) {
	hwnd, err := FindStudioWindow()
	if err != nil {
		return nil, err
	}
	return CaptureWindow(hwnd, format, quality)
}

// CaptureRawFrames captures raw BGRA pixel data for video recording.
func CaptureRawFrames(hwnd windows.HWND) ([]byte, int, int, error) {
	var rect RECT
	ret, _, _ := procGetClientRect.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&rect)))
	if ret == 0 {
		return nil, 0, 0, fmt.Errorf("failed to get client rect")
	}

	width := int(rect.Right - rect.Left)
	height := int(rect.Bottom - rect.Top)

	if width <= 0 || height <= 0 {
		ret, _, _ = procGetWindowRect.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&rect)))
		if ret == 0 {
			return nil, 0, 0, fmt.Errorf("failed to get window rect")
		}
		width = int(rect.Right - rect.Left)
		height = int(rect.Bottom - rect.Top)
		if width <= 0 || height <= 0 {
			return nil, 0, 0, fmt.Errorf("window has zero size")
		}
	}

	hdcWindow, _, _ := procGetDC.Call(uintptr(hwnd))
	if hdcWindow == 0 {
		return nil, 0, 0, fmt.Errorf("failed to get window DC")
	}
	defer procReleaseDC.Call(uintptr(hwnd), hdcWindow)

	hdcMem, _, _ := procCreateCompatibleDC.Call(hdcWindow)
	if hdcMem == 0 {
		return nil, 0, 0, fmt.Errorf("failed to create compatible DC")
	}
	defer procDeleteDC.Call(hdcMem)

	hBitmap, _, _ := procCreateCompatibleBitmap.Call(hdcWindow, uintptr(width), uintptr(height))
	if hBitmap == 0 {
		return nil, 0, 0, fmt.Errorf("failed to create compatible bitmap")
	}
	defer procDeleteObject.Call(hBitmap)

	procSelectObject.Call(hdcMem, hBitmap)

	ret, _, _ = procPrintWindow.Call(uintptr(hwnd), hdcMem, PW_CLIENTONLY)
	if ret == 0 {
		ret, _, _ = procBitBlt.Call(hdcMem, 0, 0, uintptr(width), uintptr(height),
			hdcWindow, 0, 0, SRCCOPY)
		if ret == 0 {
			return nil, 0, 0, fmt.Errorf("failed to capture window")
		}
	}

	bmi := BITMAPINFO{
		BmiHeader: BITMAPINFOHEADER{
			BiSize:        uint32(unsafe.Sizeof(BITMAPINFOHEADER{})),
			BiWidth:       int32(width),
			BiHeight:      -int32(height),
			BiPlanes:      1,
			BiBitCount:    32,
			BiCompression: BI_RGB,
		},
	}

	pixelData := make([]byte, width*height*4)
	ret, _, _ = procGetDIBits.Call(hdcMem, hBitmap, 0, uintptr(height),
		uintptr(unsafe.Pointer(&pixelData[0])),
		uintptr(unsafe.Pointer(&bmi)),
		DIB_RGB_COLORS)
	if ret == 0 {
		return nil, 0, 0, fmt.Errorf("failed to get bitmap bits")
	}

	return pixelData, width, height, nil
}

// bgraToImage converts raw BGRA pixel data to an image.RGBA.
func bgraToImage(bgra []byte, width, height int) *image.RGBA {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for i := 0; i < len(bgra)-3; i += 4 {
		img.Pix[i+0] = bgra[i+2] // R <- B
		img.Pix[i+1] = bgra[i+1] // G <- G
		img.Pix[i+2] = bgra[i+0] // B <- R
		img.Pix[i+3] = 255       // A
	}
	return img
}

// ImageToBytes encodes an image.Image to bytes in the given format.
func ImageToBytes(img image.Image, format string, quality int) ([]byte, error) {
	var buf bytes.Buffer
	switch format {
	case "jpeg", "jpg":
		err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
		if err != nil {
			return nil, err
		}
	default:
		err := png.Encode(&buf, img)
		if err != nil {
			return nil, err
		}
	}
	return buf.Bytes(), nil
}

