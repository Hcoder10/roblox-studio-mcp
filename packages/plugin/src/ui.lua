local UI = {}

local widget = nil
local status_labels = {}

function UI.create(plugin_instance)
	local widget_info = DockWidgetPluginGuiInfo.new(
		Enum.InitialDockState.Float,
		false, -- initially disabled
		false, -- override previous enabled state
		300,   -- default width
		200,   -- default height
		250,   -- min width
		150    -- min height
	)

	widget = plugin_instance:CreateDockWidgetPluginGui("StudioBridgeMCPStatus", widget_info)
	widget.Title = "Studio Bridge MCP"
	widget.Name = "StudioBridgeMCPWidget"

	local frame = Instance.new("Frame")
	frame.Size = UDim2.new(1, 0, 1, 0)
	frame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
	frame.BorderSizePixel = 0
	frame.Parent = widget

	local padding = Instance.new("UIPadding")
	padding.PaddingTop = UDim.new(0, 8)
	padding.PaddingBottom = UDim.new(0, 8)
	padding.PaddingLeft = UDim.new(0, 10)
	padding.PaddingRight = UDim.new(0, 10)
	padding.Parent = frame

	local layout = Instance.new("UIListLayout")
	layout.FillDirection = Enum.FillDirection.Vertical
	layout.Padding = UDim.new(0, 6)
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.Parent = frame

	local function create_label(parent, name, text, order, color)
		local label = Instance.new("TextLabel")
		label.Name = name
		label.Size = UDim2.new(1, 0, 0, 18)
		label.BackgroundTransparency = 1
		label.TextColor3 = color or Color3.fromRGB(200, 200, 200)
		label.TextSize = 13
		label.Font = Enum.Font.SourceSansSemibold
		label.TextXAlignment = Enum.TextXAlignment.Left
		label.Text = text
		label.LayoutOrder = order
		label.Parent = parent
		return label
	end

	local title = Instance.new("TextLabel")
	title.Name = "Title"
	title.Size = UDim2.new(1, 0, 0, 22)
	title.BackgroundTransparency = 1
	title.TextColor3 = Color3.fromRGB(255, 255, 255)
	title.TextSize = 16
	title.Font = Enum.Font.SourceSansBold
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.Text = "Studio Bridge MCP"
	title.LayoutOrder = 0
	title.Parent = frame

	local separator = Instance.new("Frame")
	separator.Name = "Separator"
	separator.Size = UDim2.new(1, 0, 0, 1)
	separator.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
	separator.BorderSizePixel = 0
	separator.LayoutOrder = 1
	separator.Parent = frame

	status_labels.status = create_label(frame, "Status", "Status: Disconnected", 2, Color3.fromRGB(255, 100, 100))
	status_labels.server = create_label(frame, "Server", "Server: --", 3)
	status_labels.token = create_label(frame, "Token", "Token: --", 4)
	status_labels.last_command = create_label(frame, "LastCommand", "Last Command: --", 5)
	status_labels.command_count = create_label(frame, "CommandCount", "Commands Processed: 0", 6)
	status_labels.uptime = create_label(frame, "Uptime", "Uptime: --", 7)

	return widget
end

function UI.show()
	if widget then
		widget.Enabled = true
	end
end

function UI.hide()
	if widget then
		widget.Enabled = false
	end
end

function UI.toggle()
	if widget then
		widget.Enabled = not widget.Enabled
	end
end

function UI.set_status(status_text, is_connected)
	if status_labels.status then
		status_labels.status.Text = "Status: " .. status_text
		if is_connected then
			status_labels.status.TextColor3 = Color3.fromRGB(100, 255, 100)
		elseif status_text == "Connecting..." then
			status_labels.status.TextColor3 = Color3.fromRGB(255, 255, 100)
		else
			status_labels.status.TextColor3 = Color3.fromRGB(255, 100, 100)
		end
	end
end

function UI.set_server(url)
	if status_labels.server then
		status_labels.server.Text = "Server: " .. (url or "--")
	end
end

function UI.set_token(token)
	if status_labels.token then
		if token and #token > 8 then
			status_labels.token.Text = "Token: " .. string.sub(token, 1, 8) .. "..."
		else
			status_labels.token.Text = "Token: " .. (token or "--")
		end
	end
end

function UI.set_last_command(command_name)
	if status_labels.last_command then
		status_labels.last_command.Text = "Last Command: " .. (command_name or "--")
	end
end

function UI.set_command_count(count)
	if status_labels.command_count then
		status_labels.command_count.Text = "Commands Processed: " .. tostring(count)
	end
end

function UI.set_uptime(seconds)
	if status_labels.uptime then
		if seconds then
			local mins = math.floor(seconds / 60)
			local secs = math.floor(seconds % 60)
			status_labels.uptime.Text = string.format("Uptime: %dm %ds", mins, secs)
		else
			status_labels.uptime.Text = "Uptime: --"
		end
	end
end

function UI.destroy()
	if widget then
		widget:Destroy()
		widget = nil
	end
	status_labels = {}
end

return UI
