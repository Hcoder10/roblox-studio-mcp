local HttpService = game:GetService("HttpService")

local Transport = require(script.transport)
local Session = require(script.session)
local Executor = require(script.executor)
local UI = require(script.ui)

-- ============================================================================
-- Configuration
-- ============================================================================

local DEFAULT_SERVER_URL = "https://roblox-studio-mcp.up.railway.app"
local POLL_INTERVAL = 0.5      -- seconds between polls
local HEARTBEAT_INTERVAL = 15  -- seconds between heartbeats
local RETRY_DELAY = 3          -- seconds to wait after connection failure

-- ============================================================================
-- State
-- ============================================================================

local state = {
	connected = false,
	connecting = false,
	token = nil,
	server_url = DEFAULT_SERVER_URL,
	command_count = 0,
	start_time = nil,
	poll_thread = nil,
	heartbeat_thread = nil,
	uptime_thread = nil,
	should_stop = false,
}

-- ============================================================================
-- Check HttpService
-- ============================================================================

local function check_http_enabled()
	local ok, err = pcall(function()
		HttpService:GetAsync("https://httpbin.org/get")
	end)
	-- If we get a "not enabled" error, warn the user
	if not ok and string.find(tostring(err), "not enabled") then
		return false
	end
	return true
end

-- ============================================================================
-- Connection Management
-- ============================================================================

local function start_poll_loop()
	state.poll_thread = task.spawn(function()
		while not state.should_stop do
			local ok, result = Transport.poll(state.server_url, state.token)

			if ok and type(result) == "table" and result.command_id then
				-- We got a command
				UI.set_last_command(result.tool or "unknown")

				-- Execute the command
				local exec_result = Executor.execute(result)
				state.command_count = state.command_count + 1
				UI.set_command_count(state.command_count)

				-- Send the result back
				local success = exec_result.success ~= false
				local resp_ok, resp_err = Transport.respond(
					state.server_url,
					state.token,
					result.command_id,
					success,
					exec_result.result,
					exec_result.error_message
				)

				if not resp_ok then
					warn("[StudioBridgeMCP] Failed to send response: " .. tostring(resp_err))
				end

				-- Re-poll immediately after processing a command
				continue
			elseif not ok then
				-- Connection problem
				if not state.should_stop then
					warn("[StudioBridgeMCP] Poll error: " .. tostring(result))
					task.wait(RETRY_DELAY)
				end
			end

			task.wait(POLL_INTERVAL)
		end
	end)
end

local function start_heartbeat_loop()
	state.heartbeat_thread = task.spawn(function()
		while not state.should_stop do
			task.wait(HEARTBEAT_INTERVAL)
			if state.should_stop then break end

			local ok, err = Transport.heartbeat(state.server_url, state.token)
			if not ok and not state.should_stop then
				warn("[StudioBridgeMCP] Heartbeat failed: " .. tostring(err))
			end
		end
	end)
end

local function start_uptime_loop()
	state.uptime_thread = task.spawn(function()
		while not state.should_stop do
			if state.start_time then
				UI.set_uptime(os.clock() - state.start_time)
			end
			task.wait(1)
		end
	end)
end

local function connect()
	if state.connected or state.connecting then
		return
	end

	state.connecting = true
	state.should_stop = false
	UI.set_status("Connecting...", false)
	UI.show()

	-- Generate or reuse token
	local token = Session.load_token(plugin) or Session.generate_token()
	Session.save_token(plugin, token)
	state.token = token

	UI.set_token(token)
	UI.set_server(state.server_url)

	-- Read server URL from plugin settings
	local saved_url = plugin:GetSetting("StudioBridgeMCP_ServerURL")
	if saved_url and type(saved_url) == "string" and #saved_url > 0 then
		state.server_url = saved_url
		UI.set_server(state.server_url)
	end

	-- Register with the server
	local ok, err = Transport.register(state.server_url, token)
	if not ok then
		warn("[StudioBridgeMCP] Registration failed: " .. tostring(err))
		UI.set_status("Connection Failed", false)
		state.connecting = false
		return
	end

	state.connected = true
	state.connecting = false
	state.start_time = os.clock()
	state.command_count = 0

	UI.set_status("Connected", true)
	UI.set_command_count(0)

	print("[StudioBridgeMCP] Connected to " .. state.server_url .. " with token " .. string.sub(token, 1, 8) .. "...")

	-- Start loops
	start_poll_loop()
	start_heartbeat_loop()
	start_uptime_loop()
end

local function disconnect()
	state.should_stop = true
	state.connected = false
	state.connecting = false
	state.start_time = nil

	-- Threads will exit on their own due to should_stop flag

	UI.set_status("Disconnected", false)
	UI.set_uptime(nil)

	print("[StudioBridgeMCP] Disconnected")
end

-- ============================================================================
-- Plugin Setup
-- ============================================================================

-- Check HttpService availability
local http_ok = true
pcall(function()
	local test_ok, test_err = pcall(function()
		return HttpService:JSONEncode({ test = true })
	end)
	if not test_ok then
		http_ok = false
	end
end)

-- Create toolbar
local toolbar = plugin:CreateToolbar("Studio Bridge MCP")

local connect_button = toolbar:CreateButton(
	"Connect",
	"Connect to Studio Bridge MCP Server",
	"rbxassetid://4458901886" -- plug icon
)

local status_button = toolbar:CreateButton(
	"Status",
	"Toggle Studio Bridge MCP Status Panel",
	"rbxassetid://4458901886"
)

-- Create UI widget
UI.create(plugin)

-- Button handlers
connect_button.Click:Connect(function()
	if state.connected then
		disconnect()
		connect_button:SetActive(false)
	else
		-- Check if HttpService can be used
		local can_http = true
		pcall(function()
			local ok, err = pcall(function()
				HttpService:RequestAsync({
					Url = state.server_url .. "/health",
					Method = "GET",
				})
			end)
			if not ok and string.find(tostring(err) or "", "Http requests are not enabled") then
				can_http = false
			end
		end)

		if not can_http then
			warn("[StudioBridgeMCP] HttpService is not enabled. Go to Game Settings > Security > Allow HTTP Requests")
			UI.set_status("HTTP Disabled", false)
			UI.show()
			return
		end

		connect()
		connect_button:SetActive(state.connected)
	end
end)

status_button.Click:Connect(function()
	UI.toggle()
	status_button:SetActive(false)
end)

-- Cleanup on plugin unloading
plugin.Unloading:Connect(function()
	disconnect()
	UI.destroy()
end)

-- Print startup info
print("[StudioBridgeMCP] Plugin loaded. Click 'Connect' to start.")
print("[StudioBridgeMCP] Supported tools: " .. #Executor.get_supported_tools())
