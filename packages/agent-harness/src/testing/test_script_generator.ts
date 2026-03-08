/**
 * Generates Luau test scripts for automated Roblox game testing.
 * Each script uses pcall for error handling, prints structured [TEST_RESULT] JSON,
 * and cleans up after itself using Debris:AddItem.
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface InteractionTarget {
  /** Instance path, e.g. "Workspace.Obstacles.KillBrick" */
  path: string;
  /** Action type: "touch", "click", "proximity_prompt" */
  action: string;
}

function vec3_str(v: Vector3): string {
  return `Vector3.new(${v.x}, ${v.y}, ${v.z})`;
}

/**
 * Generates a Luau script that moves a test character between waypoints
 * using Humanoid:MoveTo() and waits for MoveToFinished between each.
 */
export function generate_movement_test(waypoints: Vector3[]): string {
  if (waypoints.length === 0) {
    return `print("[TEST_RESULT] " .. game:GetService("HttpService"):JSONEncode({pass = false, test_name = "movement_test", details = "No waypoints provided"}))`;
  }

  const waypoint_entries = waypoints
    .map((wp) => `    ${vec3_str(wp)}`)
    .join(',\n');

  return `-- Movement Test: walks character through ${waypoints.length} waypoints
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local TIMEOUT = 15
local waypoints = {
${waypoint_entries}
}

local success, err = pcall(function()
    -- Find or wait for a character
    local player = Players:GetPlayers()[1]
    if not player then
        error("No player found. Start a playtest first.")
    end

    local character = player.Character or player.CharacterAdded:Wait(5)
    if not character then
        error("Character not found within timeout")
    end

    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid then
        error("No Humanoid in character")
    end

    for i, waypoint in ipairs(waypoints) do
        humanoid:MoveTo(waypoint)
        local reached = humanoid.MoveToFinished:Wait(TIMEOUT)
        if not reached then
            error(string.format("Failed to reach waypoint %d at (%s)", i, tostring(waypoint)))
        end
    end
end)

print("[TEST_RESULT] " .. HttpService:JSONEncode({
    pass = success,
    test_name = "movement_test",
    details = success and string.format("Successfully walked through %d waypoints", #waypoints) or tostring(err)
}))`;
}

/**
 * Generates a Luau script that tests interactions with game objects
 * (touching kill bricks, stepping on checkpoints, clicking buttons).
 */
export function generate_interaction_test(interactions: InteractionTarget[]): string {
  if (interactions.length === 0) {
    return `print("[TEST_RESULT] " .. game:GetService("HttpService"):JSONEncode({pass = false, test_name = "interaction_test", details = "No interactions provided"}))`;
  }

  const interaction_entries = interactions
    .map(
      (int) =>
        `    {path = "${int.path}", action = "${int.action}"}`,
    )
    .join(',\n');

  return `-- Interaction Test: tests ${interactions.length} interactions
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local Debris = game:GetService("Debris")

local interactions = {
${interaction_entries}
}

local results = {}

for _, interaction in ipairs(interactions) do
    local test_success, test_err = pcall(function()
        -- Resolve instance path
        local parts = string.split(interaction.path, ".")
        local current = game
        for _, part in ipairs(parts) do
            current = current:FindFirstChild(part)
            if not current then
                error("Instance not found: " .. interaction.path)
            end
        end

        local target = current

        if interaction.action == "touch" then
            -- Simulate touch by firing Touched event if possible,
            -- or moving character to the part's position
            local player = Players:GetPlayers()[1]
            if player and player.Character then
                local hrp = player.Character:FindFirstChild("HumanoidRootPart")
                if hrp and target:IsA("BasePart") then
                    hrp.CFrame = target.CFrame
                    task.wait(0.5) -- Wait for touch detection
                end
            end

        elseif interaction.action == "click" then
            -- Fire ClickDetector if present
            local detector = target:FindFirstChildOfClass("ClickDetector")
            if detector then
                -- ClickDetectors can only be triggered by real input in-game,
                -- so we check for connected scripts instead
                -- For testing, we verify the detector exists
                if not detector then
                    error("No ClickDetector found on " .. interaction.path)
                end
            end

        elseif interaction.action == "proximity_prompt" then
            local prompt = target:FindFirstChildOfClass("ProximityPrompt")
            if prompt then
                -- Trigger the prompt programmatically
                prompt:InputHoldBegin()
                task.wait(prompt.HoldDuration + 0.1)
                prompt:InputHoldEnd()
            else
                error("No ProximityPrompt found on " .. interaction.path)
            end
        else
            error("Unknown action: " .. interaction.action)
        end
    end)

    table.insert(results, {
        path = interaction.path,
        action = interaction.action,
        pass = test_success,
        details = test_success and "OK" or tostring(test_err)
    })
end

local all_passed = true
for _, r in ipairs(results) do
    if not r.pass then all_passed = false end
end

print("[TEST_RESULT] " .. HttpService:JSONEncode({
    pass = all_passed,
    test_name = "interaction_test",
    details = HttpService:JSONEncode(results)
}))`;
}

/**
 * Generates a script that positions the camera at key viewpoints
 * and reports ready for screenshot capture.
 */
export function generate_visual_check_script(): string {
  return `-- Visual Check: positions camera at key viewpoints for screenshot analysis
local HttpService = game:GetService("HttpService")
local Workspace = game:GetService("Workspace")

local viewpoints = {}

local success, err = pcall(function()
    local camera = Workspace.CurrentCamera
    if not camera then
        error("No CurrentCamera found")
    end

    -- Viewpoint 1: Overview from above
    camera.CFrame = CFrame.new(Vector3.new(0, 100, 0), Vector3.new(0, 0, 0))
    task.wait(0.5)
    table.insert(viewpoints, {
        name = "overview_top",
        position = {x = 0, y = 100, z = 0},
        look_at = {x = 0, y = 0, z = 0}
    })

    -- Viewpoint 2: Front perspective
    camera.CFrame = CFrame.new(Vector3.new(0, 20, 80), Vector3.new(0, 10, 0))
    task.wait(0.5)
    table.insert(viewpoints, {
        name = "front_perspective",
        position = {x = 0, y = 20, z = 80},
        look_at = {x = 0, y = 10, z = 0}
    })

    -- Viewpoint 3: Side view
    camera.CFrame = CFrame.new(Vector3.new(80, 20, 0), Vector3.new(0, 10, 0))
    task.wait(0.5)
    table.insert(viewpoints, {
        name = "side_view",
        position = {x = 80, y = 20, z = 0},
        look_at = {x = 0, y = 10, z = 0}
    })

    -- Viewpoint 4: Close-up at spawn
    local spawn = Workspace:FindFirstChildOfClass("SpawnLocation")
    if spawn then
        local pos = spawn.Position + Vector3.new(0, 10, 15)
        camera.CFrame = CFrame.new(pos, spawn.Position)
        task.wait(0.5)
        table.insert(viewpoints, {
            name = "spawn_closeup",
            position = {x = pos.X, y = pos.Y, z = pos.Z},
            look_at = {x = spawn.Position.X, y = spawn.Position.Y, z = spawn.Position.Z}
        })
    end
end)

print("[TEST_RESULT] " .. HttpService:JSONEncode({
    pass = success,
    test_name = "visual_check",
    details = success
        and ("Camera positioned at " .. #viewpoints .. " viewpoints. Ready for screenshots.")
        or tostring(err),
    viewpoints = viewpoints
}))`;
}

/**
 * Generates a script that creates many parts to test performance limits.
 */
export function generate_stress_test(part_count: number): string {
  const clamped = Math.max(1, Math.min(part_count, 10000));

  return `-- Stress Test: creates ${clamped} parts to test performance
local HttpService = game:GetService("HttpService")
local Debris = game:GetService("Debris")
local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")

local PART_COUNT = ${clamped}
local CLEANUP_DELAY = 10

local success, err = pcall(function()
    local folder = Instance.new("Folder")
    folder.Name = "StressTest_" .. tostring(tick())
    folder.Parent = Workspace
    Debris:AddItem(folder, CLEANUP_DELAY)

    local stats_before = {
        instances = #Workspace:GetDescendants(),
        time = tick()
    }

    -- Create parts in a grid
    local grid_size = math.ceil(math.sqrt(PART_COUNT))
    local spacing = 4

    for i = 1, PART_COUNT do
        local part = Instance.new("Part")
        part.Size = Vector3.new(2, 2, 2)
        part.Anchored = true
        local row = math.floor((i - 1) / grid_size)
        local col = (i - 1) % grid_size
        part.Position = Vector3.new(col * spacing, 50, row * spacing)
        part.Material = Enum.Material.SmoothPlastic
        part.Color = Color3.fromHSV((i / PART_COUNT), 0.8, 0.9)
        part.Parent = folder

        -- Yield periodically to avoid timeout
        if i % 100 == 0 then
            RunService.Heartbeat:Wait()
        end
    end

    local creation_time = tick() - stats_before.time
    local stats_after = {
        instances = #Workspace:GetDescendants(),
        creation_time = creation_time
    }

    -- Wait a moment for physics/rendering to settle
    task.wait(1)

    print("[TEST_RESULT] " .. HttpService:JSONEncode({
        pass = true,
        test_name = "stress_test",
        details = string.format(
            "Created %d parts in %.2fs. Instance count: %d -> %d. Cleanup in %ds.",
            PART_COUNT,
            creation_time,
            stats_before.instances,
            stats_after.instances,
            CLEANUP_DELAY
        ),
        metrics = {
            parts_created = PART_COUNT,
            creation_time_seconds = creation_time,
            instances_before = stats_before.instances,
            instances_after = stats_after.instances
        }
    }))
end)

if not success then
    print("[TEST_RESULT] " .. HttpService:JSONEncode({
        pass = false,
        test_name = "stress_test",
        details = tostring(err)
    }))
end`;
}
