local HttpService = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local LogService = game:GetService("LogService")
local Stats = game:GetService("Stats")
local RunService = game:GetService("RunService")
local Serializer = require(script.Parent.serializer)

local Executor = {}

-- ============================================================================
-- Helpers
-- ============================================================================

local function resolve_path(path)
	if not path or path == "" then
		return nil, "Path is empty"
	end
	local parts = string.split(path, ".")
	local current = game
	for _, part in ipairs(parts) do
		local child = current:FindFirstChild(part)
		if not child then
			return nil, "Could not find '" .. part .. "' in " .. current:GetFullName()
		end
		current = child
	end
	return current, nil
end

local function resolve_parent_path(path)
	if not path or path == "" then
		return game, nil
	end
	return resolve_path(path)
end

local function begin_recording(name)
	local ok, id = pcall(function()
		return ChangeHistoryService:TryBeginRecording(name)
	end)
	if ok and id then
		return id
	end
	return nil
end

local function finish_recording(id, operation)
	if id then
		pcall(function()
			ChangeHistoryService:FinishRecording(id, operation or Enum.FinishRecordingOperation.Commit)
		end)
	end
end

local function cancel_recording(id)
	if id then
		pcall(function()
			ChangeHistoryService:FinishRecording(id, Enum.FinishRecordingOperation.Cancel)
		end)
	end
end

local function apply_properties(instance, properties)
	if not properties then return end
	local deserialized = Serializer.json_to_properties(properties)
	for key, value in pairs(deserialized) do
		if key ~= "Parent" and key ~= "ClassName" and key ~= "Name" then
			pcall(function()
				(instance :: any)[key] = value
			end)
		end
	end
end

-- ============================================================================
-- Handler Table
-- ============================================================================

local HANDLERS = {}

-- ============================================================================
-- Instance Tools
-- ============================================================================

HANDLERS.instance_create = function(args)
	local class_name = args.class_name or args.className
	local parent_path = args.parent_path or args.parentPath or args.parent
	local name = args.name
	local properties = args.properties

	if not class_name then
		return { success = false, error_message = "class_name is required" }
	end

	local rec = begin_recording("Create " .. class_name)
	local ok, err = pcall(function()
		local parent = game
		if parent_path and parent_path ~= "" then
			local p, e = resolve_path(parent_path)
			if not p then error(e) end
			parent = p
		end

		local instance = Instance.new(class_name)
		if name then
			instance.Name = name
		end
		apply_properties(instance, properties)
		instance.Parent = parent

		return Serializer.instance_to_json(instance, 0)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = err }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(err) }
	end
end

HANDLERS.instance_delete = function(args)
	local path = args.path
	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Delete " .. instance.Name)
	local ok, e = pcall(function()
		instance:Destroy()
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { deleted = path } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.instance_clone = function(args)
	local path = args.path
	local new_parent_path = args.new_parent_path or args.newParentPath or args.parent_path
	local new_name = args.new_name or args.newName or args.name

	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Clone " .. instance.Name)
	local ok, result = pcall(function()
		local clone = instance:Clone()
		if new_name then
			clone.Name = new_name
		end
		if new_parent_path and new_parent_path ~= "" then
			local parent, e = resolve_path(new_parent_path)
			if not parent then error(e) end
			clone.Parent = parent
		else
			clone.Parent = instance.Parent
		end
		return Serializer.instance_to_json(clone, 0)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.instance_move = function(args)
	local path = args.path
	local new_parent_path = args.new_parent_path or args.newParentPath

	if not path or not new_parent_path then
		return { success = false, error_message = "path and new_parent_path are required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	local new_parent, err2 = resolve_path(new_parent_path)
	if not new_parent then
		return { success = false, error_message = err2 }
	end

	local rec = begin_recording("Move " .. instance.Name)
	local ok, e = pcall(function()
		instance.Parent = new_parent
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = Serializer.instance_to_json(instance, 0) }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.instance_get = function(args)
	local path = args.path
	local depth = args.depth or 1

	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	return { success = true, result = Serializer.instance_to_json(instance, depth) }
end

HANDLERS.instance_find = function(args)
	local root_path = args.root_path or args.rootPath or "Workspace"
	local class_name = args.class_name or args.className
	local name = args.name
	local recursive = args.recursive ~= false

	local root, err = resolve_path(root_path)
	if not root then
		return { success = false, error_message = err }
	end

	local results = {}
	local function search(parent)
		for _, child in ipairs(parent:GetChildren()) do
			local matches = true
			if class_name and child.ClassName ~= class_name then
				matches = false
			end
			if name and child.Name ~= name then
				matches = false
			end
			if matches then
				table.insert(results, Serializer.instance_to_json(child, 0))
				if #results >= 100 then return end
			end
			if recursive and #results < 100 then
				search(child)
			end
		end
	end

	search(root)
	return { success = true, result = results }
end

HANDLERS.instance_set_property = function(args)
	local path = args.path
	local property = args.property
	local value = args.value

	if not path or not property then
		return { success = false, error_message = "path and property are required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Set " .. property .. " on " .. instance.Name)
	local deserialized = Serializer.deserialize_value(value)
	local ok, e = pcall(function()
		(instance :: any)[property] = deserialized
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { path = path, property = property, value = Serializer.serialize_value((instance :: any)[property]) } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.instance_get_property = function(args)
	local path = args.path
	local property = args.property

	if not path or not property then
		return { success = false, error_message = "path and property are required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	local ok, value = pcall(function()
		return (instance :: any)[property]
	end)

	if ok then
		return { success = true, result = { path = path, property = property, value = Serializer.serialize_value(value) } }
	else
		return { success = false, error_message = tostring(value) }
	end
end

HANDLERS.instance_get_children = function(args)
	local path = args.path

	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	local children = {}
	for _, child in ipairs(instance:GetChildren()) do
		table.insert(children, Serializer.instance_to_json(child, 0))
	end

	return { success = true, result = children }
end

-- ============================================================================
-- Script Tools
-- ============================================================================

HANDLERS.script_create = function(args)
	local script_type = args.script_type or args.scriptType or "Script"
	local parent_path = args.parent_path or args.parentPath or args.parent or "ServerScriptService"
	local name = args.name or "NewScript"
	local source = args.source or ""

	local parent, err = resolve_path(parent_path)
	if not parent then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Create " .. script_type .. " " .. name)
	local ok, result = pcall(function()
		local s = Instance.new(script_type)
		s.Name = name
		s.Source = source
		s.Parent = parent
		return Serializer.instance_to_json(s, 0)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.script_get_source = function(args)
	local path = args.path
	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	if not instance:IsA("LuaSourceContainer") then
		return { success = false, error_message = instance:GetFullName() .. " is not a script" }
	end

	local ok, source = pcall(function()
		return instance.Source
	end)

	if ok then
		return { success = true, result = { path = path, source = source } }
	else
		return { success = false, error_message = tostring(source) }
	end
end

HANDLERS.script_set_source = function(args)
	local path = args.path
	local source = args.source

	if not path or source == nil then
		return { success = false, error_message = "path and source are required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	if not instance:IsA("LuaSourceContainer") then
		return { success = false, error_message = instance:GetFullName() .. " is not a script" }
	end

	local rec = begin_recording("Edit " .. instance.Name)
	local ok, e = pcall(function()
		instance.Source = source
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { path = path, length = #source } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.script_find = function(args)
	local root_path = args.root_path or args.rootPath or "game"
	local name_pattern = args.name_pattern or args.namePattern or args.pattern
	local script_type = args.script_type or args.scriptType

	local root
	if root_path == "game" then
		root = game
	else
		local r, err = resolve_path(root_path)
		if not r then
			return { success = false, error_message = err }
		end
		root = r
	end

	local results = {}
	local function search(parent)
		for _, child in ipairs(parent:GetChildren()) do
			if child:IsA("LuaSourceContainer") then
				local matches = true
				if script_type and child.ClassName ~= script_type then
					matches = false
				end
				if name_pattern and not string.find(child.Name, name_pattern) then
					matches = false
				end
				if matches then
					table.insert(results, {
						name = child.Name,
						className = child.ClassName,
						path = child:GetFullName(),
					})
					if #results >= 100 then return end
				end
			end
			if #results < 100 then
				search(child)
			end
		end
	end

	search(root)
	return { success = true, result = results }
end

HANDLERS.script_list = function(args)
	local root_path = args.root_path or args.rootPath or "game"
	return HANDLERS.script_find({ root_path = root_path })
end

HANDLERS.script_require_graph = function(args)
	local path = args.path

	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	if not instance:IsA("LuaSourceContainer") then
		return { success = false, error_message = "Not a script" }
	end

	local source = instance.Source
	local requires = {}
	for req in string.gmatch(source, 'require%(([^%)]+)%)') do
		table.insert(requires, req)
	end

	return { success = true, result = { path = path, requires = requires } }
end

HANDLERS.script_insert_snippet = function(args)
	local path = args.path
	local position = args.position or "end"
	local code = args.code or args.snippet
	local line_number = args.line_number or args.lineNumber

	if not path or not code then
		return { success = false, error_message = "path and code are required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	if not instance:IsA("LuaSourceContainer") then
		return { success = false, error_message = "Not a script" }
	end

	local rec = begin_recording("Insert snippet in " .. instance.Name)
	local ok, e = pcall(function()
		local source = instance.Source
		if position == "beginning" or position == "start" then
			instance.Source = code .. "\n" .. source
		elseif line_number then
			local lines = string.split(source, "\n")
			local n = math.min(line_number, #lines + 1)
			table.insert(lines, n, code)
			instance.Source = table.concat(lines, "\n")
		else
			instance.Source = source .. "\n" .. code
		end
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { path = path, position = position } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.script_replace_section = function(args)
	local path = args.path
	local old_text = args.old_text or args.oldText or args.search
	local new_text = args.new_text or args.newText or args.replace

	if not path or not old_text or not new_text then
		return { success = false, error_message = "path, old_text, and new_text are required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	if not instance:IsA("LuaSourceContainer") then
		return { success = false, error_message = "Not a script" }
	end

	local rec = begin_recording("Replace in " .. instance.Name)
	local ok, e = pcall(function()
		local source = instance.Source
		local new_source, count = string.gsub(source, old_text, new_text, 1)
		if count == 0 then
			error("Text not found in script")
		end
		instance.Source = new_source
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { path = path, replaced = true } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.script_validate_syntax = function(args)
	local source = args.source or args.code

	if not source then
		return { success = false, error_message = "source is required" }
	end

	local ok, err = pcall(function()
		loadstring(source)
	end)

	if ok then
		return { success = true, result = { valid = true } }
	else
		return { success = true, result = { valid = false, error = tostring(err) } }
	end
end

-- ============================================================================
-- Execution Tools
-- ============================================================================

HANDLERS.execution_echo = function(args)
	local message = args.message or args.text or args.input or ""
	return { success = true, result = { message = message } }
end

HANDLERS.execution_run_luau = function(args)
	local code = args.code or args.source
	if not code then
		return { success = false, error_message = "code is required" }
	end

	local fn, compile_err = loadstring(code)
	if not fn then
		return { success = false, error_message = "Compile error: " .. tostring(compile_err) }
	end

	local ok, result = pcall(fn)
	if ok then
		if type(result) == "table" then
			return { success = true, result = result }
		else
			return { success = true, result = { value = tostring(result) } }
		end
	else
		return { success = false, error_message = "Runtime error: " .. tostring(result) }
	end
end

HANDLERS.execution_eval_expression = function(args)
	local expression = args.expression or args.expr
	if not expression then
		return { success = false, error_message = "expression is required" }
	end

	local code = "return " .. expression
	local fn, compile_err = loadstring(code)
	if not fn then
		return { success = false, error_message = "Compile error: " .. tostring(compile_err) }
	end

	local ok, result = pcall(fn)
	if ok then
		return { success = true, result = { value = Serializer.serialize_value(result) } }
	else
		return { success = false, error_message = "Runtime error: " .. tostring(result) }
	end
end

HANDLERS.execution_call_function = function(args)
	local path = args.path or args.module_path or args.modulePath
	local func_name = args.function_name or args.functionName or args.func
	local func_args = args.arguments or args.args or {}

	if not path or not func_name then
		return { success = false, error_message = "path and function_name are required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	if not instance:IsA("ModuleScript") then
		return { success = false, error_message = "Not a ModuleScript" }
	end

	local ok, module = pcall(require, instance)
	if not ok then
		return { success = false, error_message = "Failed to require: " .. tostring(module) }
	end

	if type(module) ~= "table" or type(module[func_name]) ~= "function" then
		return { success = false, error_message = "Function '" .. func_name .. "' not found in module" }
	end

	local call_ok, result = pcall(module[func_name], table.unpack(func_args))
	if call_ok then
		return { success = true, result = { value = Serializer.serialize_value(result) } }
	else
		return { success = false, error_message = "Call error: " .. tostring(result) }
	end
end

HANDLERS.execution_get_globals = function(args)
	local globals = {}
	for _, name in ipairs({ "game", "workspace", "script", "plugin" }) do
		globals[name] = type(_G[name] or (getfenv and getfenv()[name]))
	end
	return { success = true, result = globals }
end

HANDLERS.execution_set_global = function(args)
	local name = args.name
	local value = args.value
	if not name then
		return { success = false, error_message = "name is required" }
	end
	rawset(_G, name, Serializer.deserialize_value(value))
	return { success = true, result = { name = name, set = true } }
end

HANDLERS.execution_require_module = function(args)
	local path = args.path
	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	if not instance:IsA("ModuleScript") then
		return { success = false, error_message = "Not a ModuleScript" }
	end

	local ok, result = pcall(require, instance)
	if ok then
		if type(result) == "table" then
			local keys = {}
			for k, v in pairs(result) do
				table.insert(keys, { key = tostring(k), type = type(v) })
			end
			return { success = true, result = { module = path, exports = keys } }
		else
			return { success = true, result = { module = path, value = tostring(result) } }
		end
	else
		return { success = false, error_message = "Require error: " .. tostring(result) }
	end
end

-- ============================================================================
-- Playtest Tools
-- ============================================================================

HANDLERS.playtest_start = function(args)
	local mode = args.mode or "Play"

	local ok, e = pcall(function()
		local PluginGuiService = game:GetService("PluginGuiService")
		if mode == "Play" then
			-- Use the plugin API or RunService approaches
			-- In plugin context, we can simulate pressing play
			game:GetService("TestService"):Run()
		elseif mode == "Run" then
			game:GetService("TestService"):Run()
		elseif mode == "PlayHere" then
			game:GetService("TestService"):Run()
		end
	end)

	if ok then
		return { success = true, result = { started = true, mode = mode } }
	else
		return { success = false, error_message = "Playtest start failed: " .. tostring(e) }
	end
end

HANDLERS.playtest_stop = function(args)
	local ok, e = pcall(function()
		game:GetService("TestService"):Stop()
	end)

	if ok then
		return { success = true, result = { stopped = true } }
	else
		return { success = false, error_message = "Playtest stop failed: " .. tostring(e) }
	end
end

HANDLERS.playtest_get_status = function(args)
	local is_running = RunService:IsRunning()
	local is_client = RunService:IsClient()
	local is_server = RunService:IsServer()
	local is_edit = RunService:IsEdit()

	return {
		success = true,
		result = {
			running = is_running,
			client = is_client,
			server = is_server,
			edit = is_edit,
		},
	}
end

HANDLERS.playtest_simulate_input = function(args)
	return {
		success = false,
		error_message = "Input simulation is not available in plugin context. Use execution_run_luau to interact with the game.",
	}
end

HANDLERS.playtest_get_player = function(args)
	local player_name = args.player_name or args.playerName

	local Players = game:GetService("Players")
	local players = Players:GetPlayers()

	if player_name then
		for _, player in ipairs(players) do
			if player.Name == player_name then
				return { success = true, result = Serializer.instance_to_json(player, 1) }
			end
		end
		return { success = false, error_message = "Player not found: " .. player_name }
	end

	local result = {}
	for _, player in ipairs(players) do
		table.insert(result, { name = player.Name, userId = player.UserId })
	end
	return { success = true, result = result }
end

HANDLERS.playtest_get_output_log = function(args)
	local count = args.count or 50
	local log_entries = {}

	local ok, _ = pcall(function()
		local history = LogService:GetLogHistory()
		local start = math.max(1, #history - count + 1)
		for i = start, #history do
			local entry = history[i]
			table.insert(log_entries, {
				message = entry.message,
				messageType = tostring(entry.messageType),
				timestamp = entry.timestamp,
			})
		end
	end)

	if ok then
		return { success = true, result = log_entries }
	else
		return { success = true, result = {} }
	end
end

HANDLERS.playtest_set_breakpoint = function(args)
	return {
		success = false,
		error_message = "Breakpoint management is not available via plugin API. Use Studio's built-in debugger.",
	}
end

HANDLERS.playtest_remove_breakpoint = function(args)
	return {
		success = false,
		error_message = "Breakpoint management is not available via plugin API. Use Studio's built-in debugger.",
	}
end

HANDLERS.playtest_step_debugger = function(args)
	return {
		success = false,
		error_message = "Debugger stepping is not available via plugin API. Use Studio's built-in debugger.",
	}
end

HANDLERS.playtest_get_call_stack = function(args)
	return {
		success = false,
		error_message = "Call stack inspection is not available via plugin API. Use Studio's built-in debugger.",
	}
end

HANDLERS.playtest_get_variables = function(args)
	return {
		success = false,
		error_message = "Variable inspection is not available via plugin API. Use Studio's built-in debugger.",
	}
end

-- ============================================================================
-- Terrain Tools
-- ============================================================================

HANDLERS.terrain_generate = function(args)
	local ok, e = pcall(function()
		local seed = args.seed
		local size = args.size or 256

		-- Clear first if requested
		if args.clear then
			workspace.Terrain:Clear()
		end

		-- Use built-in terrain generation
		workspace.Terrain:FillBlock(
			CFrame.new(0, -size / 4, 0),
			Vector3.new(size, size / 2, size),
			Enum.Material.Grass
		)
	end)

	if ok then
		return { success = true, result = { generated = true } }
	else
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.terrain_fill_region = function(args)
	local min_pos = args.min or args.min_position
	local max_pos = args.max or args.max_position
	local material = args.material or "Grass"

	if not min_pos or not max_pos then
		return { success = false, error_message = "min and max positions are required" }
	end

	local rec = begin_recording("Fill terrain region")
	local ok, e = pcall(function()
		local minV = Vector3.new(min_pos.x or 0, min_pos.y or 0, min_pos.z or 0)
		local maxV = Vector3.new(max_pos.x or 0, max_pos.y or 0, max_pos.z or 0)
		local region = Region3.new(minV, maxV):ExpandToGrid(4)
		local size = region.Size / 4
		local sx, sy, sz = math.ceil(size.X), math.ceil(size.Y), math.ceil(size.Z)

		local materials = {}
		local occupancy = {}
		for x = 1, sx do
			materials[x] = {}
			occupancy[x] = {}
			for y = 1, sy do
				materials[x][y] = {}
				occupancy[x][y] = {}
				for z = 1, sz do
					materials[x][y][z] = Enum.Material[material] or Enum.Material.Grass
					occupancy[x][y][z] = 1
				end
			end
		end

		workspace.Terrain:WriteVoxels(region, 4, materials, occupancy)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { filled = true } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.terrain_fill_ball = function(args)
	local center = args.center or args.position or { x = 0, y = 0, z = 0 }
	local radius = args.radius or 10
	local material = args.material or "Grass"

	local rec = begin_recording("Fill terrain ball")
	local ok, e = pcall(function()
		local centerV = Vector3.new(center.x or 0, center.y or 0, center.z or 0)
		local mat = Enum.Material[material] or Enum.Material.Grass
		workspace.Terrain:FillBall(centerV, radius, mat)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { filled = true, center = center, radius = radius } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.terrain_fill_cylinder = function(args)
	local center_cframe = args.cframe or args.center
	local height = args.height or 10
	local radius = args.radius or 5
	local material = args.material or "Grass"

	local rec = begin_recording("Fill terrain cylinder")
	local ok, e = pcall(function()
		local cf
		if type(center_cframe) == "table" and center_cframe.x then
			cf = CFrame.new(center_cframe.x or 0, center_cframe.y or 0, center_cframe.z or 0)
		else
			cf = CFrame.new(0, 0, 0)
		end
		local mat = Enum.Material[material] or Enum.Material.Grass
		workspace.Terrain:FillCylinder(cf, height, radius, mat)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { filled = true } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.terrain_fill_wedge = function(args)
	local cframe = args.cframe or args.center or { x = 0, y = 0, z = 0 }
	local size = args.size or { x = 10, y = 10, z = 10 }
	local material = args.material or "Grass"

	local rec = begin_recording("Fill terrain wedge")
	local ok, e = pcall(function()
		local cf
		if type(cframe) == "table" then
			cf = CFrame.new(cframe.x or 0, cframe.y or 0, cframe.z or 0)
		else
			cf = CFrame.new(0, 0, 0)
		end
		local sizeV = Vector3.new(size.x or 10, size.y or 10, size.z or 10)
		local mat = Enum.Material[material] or Enum.Material.Grass
		workspace.Terrain:FillWedge(cf, sizeV, mat)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { filled = true } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.terrain_read_voxels = function(args)
	local min_pos = args.min or args.min_position or { x = 0, y = 0, z = 0 }
	local max_pos = args.max or args.max_position or { x = 32, y = 32, z = 32 }

	local ok, result = pcall(function()
		local minV = Vector3.new(min_pos.x, min_pos.y, min_pos.z)
		local maxV = Vector3.new(max_pos.x, max_pos.y, max_pos.z)
		local region = Region3.new(minV, maxV):ExpandToGrid(4)
		local materials, occupancy, size = workspace.Terrain:ReadVoxels(region, 4)

		-- Summarize rather than returning full voxel data
		local material_counts = {}
		local total_filled = 0
		for x = 1, size.X do
			for y = 1, size.Y do
				for z = 1, size.Z do
					local mat = tostring(materials[x][y][z])
					if mat ~= "Enum.Material.Air" then
						material_counts[mat] = (material_counts[mat] or 0) + 1
						total_filled = total_filled + 1
					end
				end
			end
		end

		return {
			region_size = { x = size.X, y = size.Y, z = size.Z },
			total_voxels = size.X * size.Y * size.Z,
			filled_voxels = total_filled,
			materials = material_counts,
		}
	end)

	if ok then
		return { success = true, result = result }
	else
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.terrain_write_voxels = function(args)
	return {
		success = false,
		error_message = "Direct voxel writing requires structured 3D array data. Use terrain_fill_region, terrain_fill_ball, terrain_fill_cylinder, or terrain_fill_wedge instead.",
	}
end

HANDLERS.terrain_clear = function(args)
	local rec = begin_recording("Clear terrain")
	local ok, e = pcall(function()
		workspace.Terrain:Clear()
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { cleared = true } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.terrain_get_material_colors = function(args)
	local ok, result = pcall(function()
		local colors = {}
		for _, material in ipairs(Enum.Material:GetEnumItems()) do
			local color_ok, color = pcall(function()
				return workspace.Terrain:GetMaterialColor(material)
			end)
			if color_ok then
				colors[material.Name] = { r = color.R, g = color.G, b = color.B }
			end
		end
		return colors
	end)

	if ok then
		return { success = true, result = result }
	else
		return { success = false, error_message = tostring(result) }
	end
end

-- ============================================================================
-- Animation Tools
-- ============================================================================

HANDLERS.animation_create_keyframe_sequence = function(args)
	local name = args.name or "NewAnimation"
	local parent_path = args.parent_path or args.parentPath

	local rec = begin_recording("Create KeyframeSequence")
	local ok, result = pcall(function()
		local kfs = Instance.new("KeyframeSequence")
		kfs.Name = name

		if parent_path then
			local parent, err = resolve_path(parent_path)
			if not parent then error(err) end
			kfs.Parent = parent
		else
			kfs.Parent = workspace
		end

		return Serializer.instance_to_json(kfs, 1)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.animation_add_keyframe = function(args)
	local sequence_path = args.sequence_path or args.sequencePath or args.path
	local time_pos = args.time or args.time_position or 0
	local name = args.name or "Keyframe"

	if not sequence_path then
		return { success = false, error_message = "sequence_path is required" }
	end

	local sequence, err = resolve_path(sequence_path)
	if not sequence then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Add keyframe")
	local ok, result = pcall(function()
		local kf = Instance.new("Keyframe")
		kf.Name = name
		kf.Time = time_pos
		kf.Parent = sequence
		return Serializer.instance_to_json(kf, 0)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.animation_remove_keyframe = function(args)
	local path = args.path
	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Remove keyframe")
	local ok, e = pcall(function()
		instance:Destroy()
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = { removed = true } }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.animation_set_keyframe_pose = function(args)
	local keyframe_path = args.keyframe_path or args.keyframePath or args.path
	local part_name = args.part_name or args.partName
	local cframe_data = args.cframe or args.transform

	if not keyframe_path or not part_name then
		return { success = false, error_message = "keyframe_path and part_name are required" }
	end

	local keyframe, err = resolve_path(keyframe_path)
	if not keyframe then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Set keyframe pose")
	local ok, result = pcall(function()
		local pose = keyframe:FindFirstChild(part_name)
		if not pose then
			pose = Instance.new("Pose")
			pose.Name = part_name
			pose.Parent = keyframe
		end

		if cframe_data then
			pose.CFrame = Serializer.deserialize_value(cframe_data)
		end

		return Serializer.instance_to_json(pose, 0)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.animation_play_preview = function(args)
	return {
		success = false,
		error_message = "Animation preview playback is not available via plugin API. Use the Animation Editor in Studio.",
	}
end

HANDLERS.animation_stop_preview = function(args)
	return {
		success = false,
		error_message = "Animation preview control is not available via plugin API. Use the Animation Editor in Studio.",
	}
end

HANDLERS.animation_import = function(args)
	return {
		success = false,
		error_message = "Animation import is not available via plugin API. Use the Animation Editor or Open Cloud API.",
	}
end

HANDLERS.animation_export = function(args)
	local path = args.path
	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	return { success = true, result = Serializer.instance_to_json(instance, 10) }
end

HANDLERS.animation_get_length = function(args)
	local path = args.path
	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	if not instance:IsA("KeyframeSequence") then
		return { success = false, error_message = "Not a KeyframeSequence" }
	end

	local max_time = 0
	for _, kf in ipairs(instance:GetChildren()) do
		if kf:IsA("Keyframe") and kf.Time > max_time then
			max_time = kf.Time
		end
	end

	return { success = true, result = { length = max_time } }
end

HANDLERS.animation_list = function(args)
	local root_path = args.root_path or args.rootPath or "Workspace"
	local root, err = resolve_path(root_path)
	if not root then
		return { success = false, error_message = err }
	end

	local results = {}
	local function search(parent)
		for _, child in ipairs(parent:GetChildren()) do
			if child:IsA("KeyframeSequence") then
				table.insert(results, {
					name = child.Name,
					path = child:GetFullName(),
					keyframeCount = #child:GetChildren(),
				})
			end
			if #results < 100 then
				search(child)
			end
		end
	end

	search(root)
	return { success = true, result = results }
end

-- ============================================================================
-- Diagnostics Tools
-- ============================================================================

HANDLERS.diagnostics_get_stats = function(args)
	local ok, result = pcall(function()
		local stats_data = {}
		local heartbeat = Stats.HeartbeatTimeMs
		local instance_count = Stats.InstanceCount
		local primitives = Stats.PrimitivesCount

		stats_data.heartbeat_ms = heartbeat
		stats_data.instance_count = instance_count
		stats_data.primitives_count = primitives

		local fps_ok, fps = pcall(function()
			return 1 / RunService.Heartbeat:Wait()
		end)
		-- Don't actually wait, just report what we know
		stats_data.data_send_kbps = Stats.DataSendKBps
		stats_data.data_receive_kbps = Stats.DataReceiveKBps

		return stats_data
	end)

	if ok then
		return { success = true, result = result }
	else
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.diagnostics_get_memory = function(args)
	local ok, result = pcall(function()
		local memory = {}

		-- Get category memory usage
		local categories = {
			"Internal", "HttpCache", "Instances", "Signals",
			"LuaHeap", "Script", "PhysicsCollision", "PhysicsParts",
			"GraphicsSolidModels", "GraphicsMeshParts", "GraphicsParticles",
			"GraphicsParts", "GraphicsSpatialHash", "GraphicsTerrain",
			"GraphicsTexture", "GraphicsTextureCharacter", "Sounds",
			"StreamingSounds", "TerrainVoxels", "Navigation", "Animation",
			"Gui",
		}

		for _, category in ipairs(categories) do
			local cat_ok, value = pcall(function()
				return Stats:GetMemoryUsageMbForTag(Enum.DeveloperMemoryTag[category])
			end)
			if cat_ok and value then
				memory[category] = value
			end
		end

		local total_ok, total = pcall(function()
			return Stats:GetTotalMemoryUsageMb()
		end)
		if total_ok then
			memory.total_mb = total
		end

		return memory
	end)

	if ok then
		return { success = true, result = result }
	else
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.diagnostics_get_network_stats = function(args)
	local ok, result = pcall(function()
		return {
			data_send_kbps = Stats.DataSendKBps,
			data_receive_kbps = Stats.DataReceiveKBps,
		}
	end)

	if ok then
		return { success = true, result = result }
	else
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.diagnostics_get_physics_stats = function(args)
	local ok, result = pcall(function()
		return {
			primitives_count = Stats.PrimitivesCount,
			moving_primitives_count = Stats.MovingPrimitivesCount,
			contacts_count = Stats.ContactsCount,
		}
	end)

	if ok then
		return { success = true, result = result }
	else
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.diagnostics_get_render_stats = function(args)
	local ok, result = pcall(function()
		return {
			heartbeat_time_ms = Stats.HeartbeatTimeMs,
			instance_count = Stats.InstanceCount,
			primitives_count = Stats.PrimitivesCount,
		}
	end)

	if ok then
		return { success = true, result = result }
	else
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.diagnostics_profile_start = function(args)
	return {
		success = false,
		error_message = "Profiling is not available via plugin API. Use Studio's built-in MicroProfiler (Ctrl+F6).",
	}
end

HANDLERS.diagnostics_profile_stop = function(args)
	return {
		success = false,
		error_message = "Profiling is not available via plugin API. Use Studio's built-in MicroProfiler.",
	}
end

HANDLERS.diagnostics_profile_get_data = function(args)
	return {
		success = false,
		error_message = "Profiling data is not available via plugin API. Use Studio's built-in MicroProfiler.",
	}
end

HANDLERS.diagnostics_get_log = function(args)
	return HANDLERS.playtest_get_output_log(args)
end

HANDLERS.diagnostics_get_output = function(args)
	return HANDLERS.playtest_get_output_log(args)
end

-- ============================================================================
-- UI Builder Tools
-- ============================================================================

HANDLERS.ui_create_screen_gui = function(args)
	local name = args.name or "ScreenGui"
	local parent_path = args.parent_path or args.parentPath or "StarterGui"

	local parent, err = resolve_path(parent_path)
	if not parent then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Create ScreenGui")
	local ok, result = pcall(function()
		local gui = Instance.new("ScreenGui")
		gui.Name = name
		gui.ResetOnSpawn = false

		if args.properties then
			apply_properties(gui, args.properties)
		end

		gui.Parent = parent
		return Serializer.instance_to_json(gui, 0)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.ui_create_element = function(args)
	local class_name = args.class_name or args.className or args.element_type or "Frame"
	local parent_path = args.parent_path or args.parentPath or args.parent
	local name = args.name
	local properties = args.properties

	if not parent_path then
		return { success = false, error_message = "parent_path is required" }
	end

	local parent, err = resolve_path(parent_path)
	if not parent then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Create UI element")
	local ok, result = pcall(function()
		local element = Instance.new(class_name)
		if name then
			element.Name = name
		end
		apply_properties(element, properties)
		element.Parent = parent
		return Serializer.instance_to_json(element, 0)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.ui_set_layout = function(args)
	local parent_path = args.parent_path or args.parentPath or args.path
	local layout_type = args.layout_type or args.layoutType or "UIListLayout"
	local properties = args.properties

	if not parent_path then
		return { success = false, error_message = "parent_path is required" }
	end

	local parent, err = resolve_path(parent_path)
	if not parent then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Set UI layout")
	local ok, result = pcall(function()
		-- Remove existing layout if present
		for _, child in ipairs(parent:GetChildren()) do
			if child:IsA("UILayout") then
				child:Destroy()
			end
		end

		local layout = Instance.new(layout_type)
		apply_properties(layout, properties)
		layout.Parent = parent
		return Serializer.instance_to_json(layout, 0)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.ui_apply_style = function(args)
	local path = args.path
	local properties = args.properties or args.style

	if not path or not properties then
		return { success = false, error_message = "path and properties/style are required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Apply UI style")
	local ok, e = pcall(function()
		apply_properties(instance, properties)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = Serializer.instance_to_json(instance, 0) }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(e) }
	end
end

HANDLERS.ui_create_template = function(args)
	local path = args.path
	local template_name = args.template_name or args.templateName or args.name

	if not path then
		return { success = false, error_message = "path is required" }
	end

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	local rec = begin_recording("Create UI template")
	local ok, result = pcall(function()
		local clone = instance:Clone()
		if template_name then
			clone.Name = template_name
		end

		-- Store in ReplicatedStorage.UITemplates
		local templates_folder = game:GetService("ReplicatedStorage"):FindFirstChild("UITemplates")
		if not templates_folder then
			templates_folder = Instance.new("Folder")
			templates_folder.Name = "UITemplates"
			templates_folder.Parent = game:GetService("ReplicatedStorage")
		end

		clone.Parent = templates_folder
		return Serializer.instance_to_json(clone, 1)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.ui_instantiate_template = function(args)
	local template_name = args.template_name or args.templateName or args.name
	local parent_path = args.parent_path or args.parentPath or args.parent

	if not template_name or not parent_path then
		return { success = false, error_message = "template_name and parent_path are required" }
	end

	local parent, err = resolve_path(parent_path)
	if not parent then
		return { success = false, error_message = err }
	end

	local templates_folder = game:GetService("ReplicatedStorage"):FindFirstChild("UITemplates")
	if not templates_folder then
		return { success = false, error_message = "No UITemplates folder found" }
	end

	local template = templates_folder:FindFirstChild(template_name)
	if not template then
		return { success = false, error_message = "Template not found: " .. template_name }
	end

	local rec = begin_recording("Instantiate UI template")
	local ok, result = pcall(function()
		local instance = template:Clone()
		if args.new_name or args.newName then
			instance.Name = args.new_name or args.newName
		end
		instance.Parent = parent
		return Serializer.instance_to_json(instance, 1)
	end)

	if ok then
		finish_recording(rec)
		return { success = true, result = result }
	else
		cancel_recording(rec)
		return { success = false, error_message = tostring(result) }
	end
end

HANDLERS.ui_get_tree = function(args)
	local path = args.path or "StarterGui"
	local depth = args.depth or 5

	local instance, err = resolve_path(path)
	if not instance then
		return { success = false, error_message = err }
	end

	return { success = true, result = Serializer.instance_to_json(instance, depth) }
end

HANDLERS.ui_preview = function(args)
	return {
		success = false,
		error_message = "UI preview is not available via plugin API. View the UI in Studio's viewport or use playtest mode.",
	}
end

-- ============================================================================
-- Record/Replay Tools (action recording, not video)
-- ============================================================================

local recording_state = {
	active = false,
	name = nil,
	start_time = nil,
	events = {},
	connections = {},
}

local saved_recordings = {}

HANDLERS.record_start = function(args)
	local name = args.name or ("recording_" .. os.time())

	if recording_state.active then
		return { success = false, error_message = "A recording is already active: " .. (recording_state.name or "unknown") }
	end

	recording_state = {
		active = true,
		name = name,
		start_time = os.clock(),
		events = {},
		connections = {},
	}

	-- Listen for property changes on common services
	local function on_descendant_added(instance)
		if recording_state.active then
			table.insert(recording_state.events, {
				type = "added",
				time = os.clock() - recording_state.start_time,
				className = instance.ClassName,
				name = instance.Name,
				path = instance:GetFullName(),
			})
		end
	end

	local function on_descendant_removing(instance)
		if recording_state.active then
			table.insert(recording_state.events, {
				type = "removing",
				time = os.clock() - recording_state.start_time,
				className = instance.ClassName,
				name = instance.Name,
				path = instance:GetFullName(),
			})
		end
	end

	table.insert(recording_state.connections,
		workspace.DescendantAdded:Connect(on_descendant_added)
	)
	table.insert(recording_state.connections,
		workspace.DescendantRemoving:Connect(on_descendant_removing)
	)

	return { success = true, result = { recording = name, started = true } }
end

HANDLERS.record_stop = function(args)
	if not recording_state.active then
		return { success = false, error_message = "No active recording" }
	end

	local name = recording_state.name
	local duration = os.clock() - recording_state.start_time

	-- Disconnect all listeners
	for _, conn in ipairs(recording_state.connections) do
		conn:Disconnect()
	end

	saved_recordings[name] = {
		name = name,
		duration = duration,
		event_count = #recording_state.events,
		events = recording_state.events,
		timestamp = os.time(),
	}

	recording_state = {
		active = false,
		name = nil,
		start_time = nil,
		events = {},
		connections = {},
	}

	return {
		success = true,
		result = {
			recording = name,
			stopped = true,
			duration = duration,
			event_count = saved_recordings[name].event_count,
		},
	}
end

HANDLERS.record_get_status = function(args)
	if recording_state.active then
		return {
			success = true,
			result = {
				active = true,
				name = recording_state.name,
				duration = os.clock() - recording_state.start_time,
				event_count = #recording_state.events,
			},
		}
	else
		return {
			success = true,
			result = { active = false },
		}
	end
end

HANDLERS.record_list = function(args)
	local list = {}
	for name, rec in pairs(saved_recordings) do
		table.insert(list, {
			name = name,
			duration = rec.duration,
			event_count = rec.event_count,
			timestamp = rec.timestamp,
		})
	end
	return { success = true, result = list }
end

HANDLERS.record_replay_start = function(args)
	return {
		success = false,
		error_message = "Replay playback is not yet implemented. Recordings can be exported and reviewed.",
	}
end

HANDLERS.record_replay_stop = function(args)
	return {
		success = false,
		error_message = "Replay playback is not yet implemented.",
	}
end

HANDLERS.record_replay_get_status = function(args)
	return {
		success = true,
		result = { replaying = false },
	}
end

HANDLERS.record_export = function(args)
	local name = args.name
	if not name then
		return { success = false, error_message = "name is required" }
	end

	local rec = saved_recordings[name]
	if not rec then
		return { success = false, error_message = "Recording not found: " .. name }
	end

	return { success = true, result = rec }
end

HANDLERS.record_delete = function(args)
	local name = args.name
	if not name then
		return { success = false, error_message = "name is required" }
	end

	if not saved_recordings[name] then
		return { success = false, error_message = "Recording not found: " .. name }
	end

	saved_recordings[name] = nil
	return { success = true, result = { deleted = name } }
end

-- ============================================================================
-- Executor dispatch
-- ============================================================================

function Executor.execute(command)
	local tool = command.tool
	local args = command.args or {}

	if not tool then
		return { success = false, error_message = "No tool specified in command" }
	end

	local handler = HANDLERS[tool]
	if not handler then
		return { success = false, error_message = "Unknown tool: " .. tostring(tool) }
	end

	local ok, result = pcall(handler, args)
	if ok then
		return result
	else
		return { success = false, error_message = "Handler error: " .. tostring(result) }
	end
end

function Executor.get_supported_tools()
	local tools = {}
	for name, _ in pairs(HANDLERS) do
		table.insert(tools, name)
	end
	table.sort(tools)
	return tools
end

return Executor
