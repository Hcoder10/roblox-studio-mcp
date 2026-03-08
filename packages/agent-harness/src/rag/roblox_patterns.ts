import type { Chunk } from './vector_store.js';

/**
 * Hardcoded expert knowledge chunks covering Roblox Studio patterns.
 * These are the most valuable chunks in the RAG system - they contain
 * actual working code examples and best practices.
 */
export function get_roblox_patterns(): Chunk[] {
  return [
    // ═══════════════════════════════════════════════════════════════
    // BUILDING PATTERNS
    // ═══════════════════════════════════════════════════════════════

    {
      id: 'pattern:cframe-math',
      title: 'CFrame Math - Positioning, Rotation, and Transforms',
      category: 'pattern',
      tags: ['cframe', 'position', 'rotation', 'transform', 'lookat', 'angles', 'math', 'building'],
      content: `# CFrame Math

CFrame (Coordinate Frame) represents position + rotation in 3D space. It is the most important math type for building in Roblox.

## Creating CFrames
\`\`\`lua
-- Position only (no rotation)
local cf = CFrame.new(10, 5, -20)

-- Position + look at target
local cf = CFrame.lookAt(Vector3.new(0, 5, 0), Vector3.new(10, 5, 10))

-- Position + rotation from Euler angles (radians)
local cf = CFrame.new(0, 5, 0) * CFrame.Angles(0, math.rad(45), 0)

-- From axis-angle rotation
local cf = CFrame.fromAxisAngle(Vector3.yAxis, math.rad(90))

-- Identity (origin, no rotation)
local cf = CFrame.identity
\`\`\`

## Common Operations
\`\`\`lua
-- Move part relative to its own orientation
part.CFrame = part.CFrame * CFrame.new(0, 0, -5) -- forward 5 studs
part.CFrame = part.CFrame * CFrame.new(5, 0, 0)  -- right 5 studs

-- Rotate part around its own Y axis
part.CFrame = part.CFrame * CFrame.Angles(0, math.rad(45), 0)

-- Position a part at a world position keeping its rotation
part.CFrame = CFrame.new(newPosition) * part.CFrame.Rotation

-- Get the forward/right/up vectors of a CFrame
local lookVector = cf.LookVector    -- forward direction (Z axis)
local rightVector = cf.RightVector  -- right direction (X axis)
local upVector = cf.UpVector        -- up direction (Y axis)

-- Inverse a CFrame (useful for relative positioning)
local relative = partA.CFrame:Inverse() * partB.CFrame

-- Lerp between two CFrames (smooth interpolation)
local mid = cf1:Lerp(cf2, 0.5) -- 50% between cf1 and cf2

-- Convert world position to local space
local localPos = part.CFrame:PointToObjectSpace(worldPosition)
local worldPos = part.CFrame:PointToWorldSpace(localPosition)
\`\`\`

## Placing Parts in a Circle
\`\`\`lua
local count = 12
local radius = 20
for i = 1, count do
    local angle = (i / count) * math.pi * 2
    local x = math.cos(angle) * radius
    local z = math.sin(angle) * radius
    local part = Instance.new("Part")
    part.Size = Vector3.new(4, 4, 4)
    part.CFrame = CFrame.new(x, 5, z)
    part.Anchored = true
    part.Parent = workspace
end
\`\`\`

## Placing Parts Along a Curve
\`\`\`lua
-- Bezier curve between points
local function bezier(t, p0, p1, p2)
    return (1-t)^2 * p0 + 2*(1-t)*t * p1 + t^2 * p2
end

for i = 0, 20 do
    local t = i / 20
    local pos = bezier(t, Vector3.new(0,0,0), Vector3.new(10,20,0), Vector3.new(20,0,0))
    local part = Instance.new("Part")
    part.Size = Vector3.new(2, 2, 2)
    part.Position = pos
    part.Anchored = true
    part.Parent = workspace
end
\`\`\``,
    },

    {
      id: 'pattern:part-types',
      title: 'Part Types and When to Use Each',
      category: 'pattern',
      tags: ['part', 'meshpart', 'wedgepart', 'union', 'trusspart', 'cornerpart', 'building', 'geometry'],
      content: `# Part Types in Roblox Studio

## Basic Parts
\`\`\`lua
-- Block (default)
local part = Instance.new("Part")
part.Shape = Enum.PartType.Block
part.Size = Vector3.new(4, 1, 2)

-- Ball / Sphere
local ball = Instance.new("Part")
ball.Shape = Enum.PartType.Ball
ball.Size = Vector3.new(4, 4, 4) -- uniform size for spheres

-- Cylinder
local cyl = Instance.new("Part")
cyl.Shape = Enum.PartType.Cylinder
cyl.Size = Vector3.new(4, 2, 2) -- X = length, Y/Z = diameter

-- Wedge
local wedge = Instance.new("WedgePart")
wedge.Size = Vector3.new(4, 4, 4)

-- Corner Wedge
local corner = Instance.new("CornerWedgePart")
corner.Size = Vector3.new(4, 4, 4)
\`\`\`

## When to Use Each
- **Part (Block)**: Walls, floors, platforms, rectangular geometry. Most common.
- **Part (Ball)**: Decorations, projectiles, rounded objects. Always a perfect sphere.
- **Part (Cylinder)**: Pillars, pipes, wheels, tree trunks. Oriented along X axis.
- **WedgePart**: Ramps, roofs, slopes, angled surfaces. Triangle cross-section.
- **CornerWedgePart**: Roof corners, pyramid tips. Fits into 90-degree corners.
- **TrussPart**: Ladders and climbable structures. Players can climb truss parts automatically.
- **MeshPart**: Complex 3D models imported from Blender/Maya. Use for detailed props.
- **UnionOperation**: CSG (Constructive Solid Geometry) from combining/negating parts. Use NegateOperation for holes.

## MeshPart Usage
\`\`\`lua
-- MeshParts are created by importing .fbx or .obj files
-- In scripts, you reference existing MeshParts:
local mesh = workspace.MyMeshPart
mesh.TextureID = "rbxassetid://123456" -- optional texture
mesh.CollisionFidelity = Enum.CollisionFidelity.Box -- for performance
mesh.RenderFidelity = Enum.RenderFidelity.Automatic
\`\`\`

## TrussPart (Climbable Ladder)
\`\`\`lua
local truss = Instance.new("TrussPart")
truss.Size = Vector3.new(2, 20, 2) -- tall ladder
truss.CFrame = CFrame.new(0, 10, 0)
truss.Anchored = true
truss.Parent = workspace
-- Players automatically climb TrussParts when touching them
\`\`\`

## Union Operations (CSG)
\`\`\`lua
-- In Studio: Select parts > Model tab > Union or Negate
-- In scripts (limited):
local part1 = workspace.Part1
local part2 = workspace.Part2
local union = part1:UnionAsync({part2})
union.Parent = workspace
-- Note: UnionAsync is expensive, prefer doing CSG in Studio
\`\`\``,
    },

    {
      id: 'pattern:model-organization',
      title: 'Model Organization - PrimaryPart, PivotTo, Grouping',
      category: 'pattern',
      tags: ['model', 'primarypart', 'pivotto', 'group', 'organization', 'building', 'hierarchy'],
      content: `# Model Organization

Models group related parts together. Proper model organization is critical for maintainable games.

## Setting Up a Model
\`\`\`lua
local model = Instance.new("Model")
model.Name = "House"

-- Create parts
local floor = Instance.new("Part")
floor.Name = "Floor"
floor.Size = Vector3.new(20, 1, 20)
floor.Position = Vector3.new(0, 0.5, 0)
floor.Anchored = true
floor.Parent = model

local wall = Instance.new("Part")
wall.Name = "Wall"
wall.Size = Vector3.new(20, 10, 1)
wall.Position = Vector3.new(0, 5.5, -9.5)
wall.Anchored = true
wall.Parent = model

-- IMPORTANT: Set PrimaryPart for moving the entire model
model.PrimaryPart = floor
model.Parent = workspace
\`\`\`

## Moving Models with PivotTo
\`\`\`lua
-- PivotTo moves the entire model, maintaining relative positions
model:PivotTo(CFrame.new(50, 0, 50))

-- Get current pivot
local pivot = model:GetPivot()

-- Move relative to current position
model:PivotTo(pivot * CFrame.new(10, 0, 0))

-- Rotate the entire model
model:PivotTo(pivot * CFrame.Angles(0, math.rad(90), 0))
\`\`\`

## Model Hierarchy Best Practices
\`\`\`
Game
  Workspace
    Map (Folder)
      Buildings (Folder)
        House1 (Model) -- PrimaryPart = Foundation
          Foundation (Part)
          Walls (Folder)
          Roof (Model)
          Furniture (Folder)
        House2 (Model)
      Environment (Folder)
        Trees (Folder)
        Rocks (Folder)
    Gameplay (Folder)
      SpawnPoints (Folder)
      Checkpoints (Folder)
  ServerStorage
    Templates (Folder) -- Cloneable templates
      WeaponTemplate (Model)
      NPCTemplate (Model)
  ReplicatedStorage
    SharedModules (Folder)
    Assets (Folder)
\`\`\`

## Bounding Box
\`\`\`lua
-- Get model bounding box
local cf, size = model:GetBoundingBox()
-- cf = CFrame at center, size = Vector3 of extents

-- Check if a point is inside the model's bounding box
local function is_inside(model, point)
    local cf, size = model:GetBoundingBox()
    local relative = cf:PointToObjectSpace(point)
    local half = size / 2
    return math.abs(relative.X) <= half.X
       and math.abs(relative.Y) <= half.Y
       and math.abs(relative.Z) <= half.Z
end
\`\`\``,
    },

    {
      id: 'pattern:terrain-api',
      title: 'Terrain API - Sculpting, Filling, and Custom Terrain',
      category: 'pattern',
      tags: ['terrain', 'fillblock', 'fillball', 'fillcylinder', 'fillregion', 'writevoxels', 'landscape', 'building'],
      content: `# Terrain API

Roblox terrain uses a voxel system at 4-stud resolution. The Terrain object is a child of Workspace.

## Basic Fill Operations
\`\`\`lua
local terrain = workspace.Terrain

-- Fill a rectangular region with material
terrain:FillBlock(
    CFrame.new(0, -10, 0),         -- center CFrame
    Vector3.new(100, 20, 100),     -- size
    Enum.Material.Grass             -- material
)

-- Fill a sphere
terrain:FillBall(
    Vector3.new(0, 5, 0),  -- center position
    15,                      -- radius
    Enum.Material.Rock       -- material
)

-- Fill a cylinder
terrain:FillCylinder(
    CFrame.new(0, 0, 0),          -- center CFrame
    20,                             -- height
    10,                             -- radius
    Enum.Material.Sand              -- material
)

-- Fill a wedge shape (for slopes)
terrain:FillWedge(
    CFrame.new(0, 5, 0),           -- center CFrame
    Vector3.new(20, 10, 20),       -- size
    Enum.Material.Grass             -- material
)
\`\`\`

## Clearing Terrain
\`\`\`lua
-- Clear everything
terrain:Clear()

-- Clear a region by filling with Air
terrain:FillBlock(
    CFrame.new(0, 0, 0),
    Vector3.new(50, 50, 50),
    Enum.Material.Air
)
\`\`\`

## Creating a Landscape
\`\`\`lua
-- Simple procedural terrain with hills
local resolution = 4 -- terrain voxel size
local mapSize = 200

for x = -mapSize/2, mapSize/2, resolution do
    for z = -mapSize/2, mapSize/2, resolution do
        -- Simple noise-based height
        local height = math.noise(x/50, z/50) * 20 + 10
        terrain:FillBlock(
            CFrame.new(x, height/2, z),
            Vector3.new(resolution, height, resolution),
            Enum.Material.Grass
        )
    end
end

-- Add water at sea level
terrain:FillBlock(
    CFrame.new(0, -2, 0),
    Vector3.new(mapSize, 4, mapSize),
    Enum.Material.Water
)
\`\`\`

## Terrain Materials
Common materials: Grass, Sand, Rock, Slate, Snow, Mud, Ground, Sandstone, Limestone, Basalt, Asphalt, LeafyGrass, Pavement, WoodPlanks, Glacier, CrackedLava, Ice, Salt, Water

## WriteVoxels for Precise Control
\`\`\`lua
-- WriteVoxels gives per-voxel control
local region = Region3.new(
    Vector3.new(-20, -20, -20),
    Vector3.new(20, 20, 20)
):ExpandToGrid(4)

local size = region.Size / 4 -- number of voxels
local materials = {}
local occupancy = {}

for x = 1, size.X do
    materials[x] = {}
    occupancy[x] = {}
    for y = 1, size.Y do
        materials[x][y] = {}
        occupancy[x][y] = {}
        for z = 1, size.Z do
            materials[x][y][z] = Enum.Material.Grass
            occupancy[x][y][z] = 1 -- fully occupied
        end
    end
end

terrain:WriteVoxels(region, 4, materials, occupancy)
\`\`\``,
    },

    {
      id: 'pattern:welding',
      title: 'Welding - WeldConstraint, Motor6D, ManualWeld',
      category: 'pattern',
      tags: ['weld', 'weldconstraint', 'motor6d', 'manualweld', 'constraint', 'physics', 'joint', 'building'],
      content: `# Welding Parts Together

Welds keep parts connected. Use the right type for your use case.

## WeldConstraint (Most Common)
\`\`\`lua
-- Simplest way to weld two parts. Maintains their relative positions.
local weld = Instance.new("WeldConstraint")
weld.Part0 = partA
weld.Part1 = partB
weld.Parent = partA
-- That's it! partB follows partA's movement.
-- At least one part must be unanchored for the weld to matter.
\`\`\`

**When to use WeldConstraint:**
- Attaching decorations to moving parts
- Building vehicles from multiple parts
- Any rigid connection between parts
- Tool handles to character hands

## Motor6D (For Animation)
\`\`\`lua
-- Motor6D allows rotation around joints (used in character rigs)
local motor = Instance.new("Motor6D")
motor.Part0 = torso
motor.Part1 = arm
motor.C0 = CFrame.new(1.5, 0.5, 0) -- offset from Part0
motor.C1 = CFrame.new(0, 0.5, 0)   -- offset from Part1
motor.Parent = torso
\`\`\`

**When to use Motor6D:**
- Character rigs and custom characters
- Animated mechanical parts (doors, hinges with specific animation)
- Anything that needs to be animated with the Animation Editor

## Weld (Legacy)
\`\`\`lua
-- Legacy Weld type. Use WeldConstraint instead for new work.
local weld = Instance.new("Weld")
weld.Part0 = partA
weld.Part1 = partB
weld.C0 = CFrame.new(0, 2, 0) -- offset from Part0
weld.C1 = CFrame.new()        -- offset from Part1
weld.Parent = partA
\`\`\`

## Welding a Tool to Character's Hand
\`\`\`lua
-- When a player equips a tool, weld the handle to their hand
tool.Equipped:Connect(function()
    local character = tool.Parent
    local hand = character:FindFirstChild("Right Arm") or character:FindFirstChild("RightHand")
    if hand then
        local weld = Instance.new("WeldConstraint")
        weld.Part0 = hand
        weld.Part1 = tool.Handle
        weld.Parent = tool.Handle
    end
end)
\`\`\`

## Collision Groups with Welded Parts
\`\`\`lua
-- Often you want welded parts to not collide with each other
local PhysicsService = game:GetService("PhysicsService")
PhysicsService:RegisterCollisionGroup("Vehicle")
PhysicsService:CollisionGroupSetCollidable("Vehicle", "Vehicle", false)

for _, part in model:GetDescendants() do
    if part:IsA("BasePart") then
        part.CollisionGroup = "Vehicle"
    end
end
\`\`\``,
    },

    {
      id: 'pattern:collision-physics',
      title: 'Collision Groups and Physics Settings',
      category: 'pattern',
      tags: ['collision', 'physics', 'collisiongroup', 'cancollide', 'cantouch', 'canquery', 'massless', 'building'],
      content: `# Collision Groups and Physics

## BasePart Physics Properties
\`\`\`lua
part.Anchored = true      -- immovable, ignores physics
part.CanCollide = true     -- other parts collide with it
part.CanTouch = true       -- fires .Touched events
part.CanQuery = true       -- detected by raycasts
part.Massless = false      -- if true, doesn't contribute to assembly mass
part.CustomPhysicalProperties = PhysicalProperties.new(
    0.7,  -- Density
    0.3,  -- Friction
    0.5,  -- Elasticity (bounciness)
    1,    -- FrictionWeight
    1     -- ElasticityWeight
)
\`\`\`

## Collision Groups
\`\`\`lua
local PhysicsService = game:GetService("PhysicsService")

-- Register groups
PhysicsService:RegisterCollisionGroup("Players")
PhysicsService:RegisterCollisionGroup("Projectiles")
PhysicsService:RegisterCollisionGroup("Ragdolls")

-- Set collision rules
PhysicsService:CollisionGroupSetCollidable("Players", "Projectiles", false) -- bullets pass through
PhysicsService:CollisionGroupSetCollidable("Ragdolls", "Ragdolls", false)   -- ragdolls don't collide

-- Assign parts to groups
character.HumanoidRootPart.CollisionGroup = "Players"
bullet.CollisionGroup = "Projectiles"
\`\`\`

## Raycasting with Collision Filters
\`\`\`lua
local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude
rayParams.FilterDescendantsInstances = {character} -- ignore own character
rayParams.CollisionGroup = "Default"

local result = workspace:Raycast(origin, direction * 100, rayParams)
if result then
    print(result.Instance.Name, result.Position, result.Normal)
end
\`\`\`

## Spatial Queries
\`\`\`lua
-- Box overlap
local overlapParams = OverlapParams.new()
overlapParams.FilterType = Enum.RaycastFilterType.Include
overlapParams.FilterDescendantsInstances = {workspace.Enemies}

local parts = workspace:GetPartBoundsInBox(
    CFrame.new(0, 5, 0),     -- center
    Vector3.new(20, 10, 20), -- size
    overlapParams
)

-- Sphere overlap
local parts = workspace:GetPartBoundsInRadius(
    Vector3.new(0, 5, 0), -- center
    15,                     -- radius
    overlapParams
)
\`\`\`

## StreamingEnabled Considerations
When StreamingEnabled is on:
- Parts far from the player may not exist on the client
- Use \`workspace.StreamingEnabled\` to check
- Use \`player:RequestStreamAroundAsync(position)\` to load an area
- Use \`BasePart.StreamingMode = Enum.StreamingMode.Persistent\` for important parts
- Models with ModelStreamingMode = Atomic stream as a unit`,
    },

    // ═══════════════════════════════════════════════════════════════
    // SCRIPTING PATTERNS
    // ═══════════════════════════════════════════════════════════════

    {
      id: 'pattern:server-client-remotes',
      title: 'Server/Client Architecture with RemoteEvents and RemoteFunctions',
      category: 'pattern',
      tags: ['remote', 'remoteevent', 'remotefunction', 'server', 'client', 'networking', 'scripting', 'filteringenabled'],
      content: `# Server/Client Architecture

Roblox uses a client-server model. Scripts run on the server (Script), LocalScripts run on the client. They communicate via RemoteEvents and RemoteFunctions in ReplicatedStorage.

## RemoteEvent (Fire-and-forget)
\`\`\`lua
-- Create in ReplicatedStorage
local remote = Instance.new("RemoteEvent")
remote.Name = "DamageEvent"
remote.Parent = game:GetService("ReplicatedStorage")

-- SERVER: Listen for client requests
remote.OnServerEvent:Connect(function(player, targetId, damage)
    -- ALWAYS validate on server! Never trust the client.
    if typeof(damage) ~= "number" then return end
    if damage < 0 or damage > 100 then return end

    local target = workspace:FindFirstChild(targetId)
    if not target then return end

    local humanoid = target:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    -- Check distance (anti-exploit)
    local dist = (player.Character.HumanoidRootPart.Position - target.Position).Magnitude
    if dist > 20 then return end

    humanoid:TakeDamage(damage)
end)

-- CLIENT: Fire the event
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local remote = ReplicatedStorage:WaitForChild("DamageEvent")
remote:FireServer(target.Name, 25)
\`\`\`

## RemoteFunction (Request/Response)
\`\`\`lua
-- SERVER
local remote = Instance.new("RemoteFunction")
remote.Name = "GetPlayerData"
remote.Parent = game:GetService("ReplicatedStorage")

remote.OnServerInvoke = function(player)
    -- Return data to the requesting client
    return {
        coins = 100,
        level = 5,
        inventory = {"Sword", "Shield"},
    }
end

-- CLIENT
local data = ReplicatedStorage:WaitForChild("GetPlayerData"):InvokeServer()
print(data.coins) -- 100
\`\`\`

## Server to Client Communication
\`\`\`lua
-- SERVER: Send to one player
remote:FireClient(player, "You got hit!", 25)

-- SERVER: Send to all players
remote:FireAllClients("Round started!", 60)

-- CLIENT: Listen
remote.OnClientEvent:Connect(function(message, value)
    print(message, value)
end)
\`\`\`

## Security Rules
1. **NEVER trust client input** - always validate on server
2. **NEVER put game logic in LocalScripts** - clients can exploit
3. **Always type-check remote arguments** - exploiters send anything
4. **Rate-limit remote calls** - prevent spam
5. **Check distances** - verify player is close enough to interact

## Rate Limiting Pattern
\`\`\`lua
local lastAction = {}
remote.OnServerEvent:Connect(function(player, ...)
    local now = tick()
    if lastAction[player] and now - lastAction[player] < 0.5 then
        return -- too fast, ignore
    end
    lastAction[player] = now
    -- process action
end)
\`\`\``,
    },

    {
      id: 'pattern:datastore',
      title: 'DataStore Patterns - Save/Load Player Data',
      category: 'pattern',
      tags: ['datastore', 'save', 'load', 'data', 'persistence', 'getasync', 'setasync', 'updateasync', 'scripting'],
      content: `# DataStore Patterns

DataStores persist data between game sessions. Always use on the SERVER only.

## Basic DataStore Usage
\`\`\`lua
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local playerStore = DataStoreService:GetDataStore("PlayerData_v1")

-- Default data for new players
local DEFAULT_DATA = {
    coins = 0,
    level = 1,
    inventory = {},
    settings = { music = true, sfx = true },
}

-- In-memory cache
local playerData = {}

Players.PlayerAdded:Connect(function(player)
    local success, data = pcall(function()
        return playerStore:GetAsync("Player_" .. player.UserId)
    end)

    if success then
        if data then
            playerData[player] = data
        else
            -- New player, use defaults
            playerData[player] = table.clone(DEFAULT_DATA)
        end
    else
        warn("Failed to load data for", player.Name, data)
        -- Give default data so they can still play
        playerData[player] = table.clone(DEFAULT_DATA)
    end
end)

Players.PlayerRemoving:Connect(function(player)
    if playerData[player] then
        local success, err = pcall(function()
            playerStore:SetAsync("Player_" .. player.UserId, playerData[player])
        end)
        if not success then
            warn("Failed to save data for", player.Name, err)
        end
        playerData[player] = nil
    end
end)

-- Also save on server shutdown
game:BindToClose(function()
    for _, player in Players:GetPlayers() do
        if playerData[player] then
            pcall(function()
                playerStore:SetAsync("Player_" .. player.UserId, playerData[player])
            end)
        end
    end
end)
\`\`\`

## UpdateAsync for Safe Concurrent Updates
\`\`\`lua
-- UpdateAsync is atomic - prevents data loss from concurrent writes
local function add_coins(player, amount)
    local success, err = pcall(function()
        playerStore:UpdateAsync("Player_" .. player.UserId, function(old)
            old = old or table.clone(DEFAULT_DATA)
            old.coins = (old.coins or 0) + amount
            return old
        end)
    end)
    if success then
        playerData[player].coins += amount
    end
end
\`\`\`

## Retry Logic
\`\`\`lua
local function retry_async(func, maxRetries)
    maxRetries = maxRetries or 3
    for attempt = 1, maxRetries do
        local success, result = pcall(func)
        if success then return true, result end
        if attempt < maxRetries then
            task.wait(2 ^ attempt) -- exponential backoff
        end
    end
    return false, "Max retries exceeded"
end

-- Usage
local success, data = retry_async(function()
    return playerStore:GetAsync("Player_" .. player.UserId)
end)
\`\`\`

## Leaderstats (Visible Leaderboard)
\`\`\`lua
Players.PlayerAdded:Connect(function(player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = playerData[player].coins or 0
    coins.Parent = leaderstats
end)
\`\`\``,
    },

    {
      id: 'pattern:module-scripts',
      title: 'Module Script Organization',
      category: 'pattern',
      tags: ['module', 'modulescript', 'require', 'organization', 'architecture', 'scripting', 'replicatedstorage'],
      content: `# Module Script Organization

Module scripts are reusable code libraries. They return a table of functions/data.

## Basic Module Script
\`\`\`lua
-- ReplicatedStorage/Modules/MathUtil.lua (ModuleScript)
local MathUtil = {}

function MathUtil.lerp(a, b, t)
    return a + (b - a) * t
end

function MathUtil.clamp(value, min, max)
    return math.max(min, math.min(max, value))
end

function MathUtil.round(value, decimals)
    local mult = 10 ^ (decimals or 0)
    return math.floor(value * mult + 0.5) / mult
end

return MathUtil
\`\`\`

## Using Module Scripts
\`\`\`lua
-- In any Script or LocalScript:
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MathUtil = require(ReplicatedStorage.Modules.MathUtil)

print(MathUtil.lerp(0, 100, 0.5)) -- 50
\`\`\`

## Organization Best Practices
\`\`\`
ReplicatedStorage/
  Modules/            -- Shared between server and client
    Config.lua        -- Game constants
    Types.lua         -- Type definitions
    MathUtil.lua      -- Math helpers
    UIUtil.lua        -- UI helpers

ServerStorage/
  ServerModules/      -- Server-only code
    DataManager.lua   -- DataStore wrapper
    GameManager.lua   -- Round/game logic
    ShopManager.lua   -- Purchase validation

ServerScriptService/
  Scripts/
    Main.lua          -- Entry point, requires ServerModules
    DataScript.lua    -- Handles data saving

StarterPlayer/
  StarterPlayerScripts/
    ClientMain.lua    -- Client entry point
    InputController.lua
  StarterCharacterScripts/
    Animate.lua       -- Default or custom animation script
\`\`\`

## Class-like Module Pattern
\`\`\`lua
-- ServerStorage/ServerModules/EnemyClass.lua
local Enemy = {}
Enemy.__index = Enemy

function Enemy.new(name, health, speed)
    local self = setmetatable({}, Enemy)
    self.name = name
    self.health = health
    self.maxHealth = health
    self.speed = speed
    self.model = nil
    return self
end

function Enemy:takeDamage(amount)
    self.health = math.max(0, self.health - amount)
    if self.health <= 0 then
        self:die()
    end
end

function Enemy:die()
    if self.model then
        self.model:Destroy()
    end
end

function Enemy:spawn(position)
    local template = game:GetService("ServerStorage").EnemyTemplate:Clone()
    template:PivotTo(CFrame.new(position))
    template.Parent = workspace
    self.model = template
end

return Enemy
\`\`\``,
    },

    {
      id: 'pattern:player-lifecycle',
      title: 'Player Lifecycle - PlayerAdded, PlayerRemoving, CharacterAdded',
      category: 'pattern',
      tags: ['player', 'playeradded', 'playerremoving', 'characteradded', 'spawn', 'lifecycle', 'scripting'],
      content: `# Player Lifecycle

## Core Events
\`\`\`lua
local Players = game:GetService("Players")

-- Fires when a player joins the game
Players.PlayerAdded:Connect(function(player)
    print(player.Name, "joined!")

    -- Set up leaderstats, data, etc.
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local score = Instance.new("IntValue")
    score.Name = "Score"
    score.Value = 0
    score.Parent = leaderstats

    -- CharacterAdded fires each time the player spawns/respawns
    player.CharacterAdded:Connect(function(character)
        print(player.Name, "spawned!")

        local humanoid = character:WaitForChild("Humanoid")
        local hrp = character:WaitForChild("HumanoidRootPart")

        -- Do something when the character dies
        humanoid.Died:Connect(function()
            print(player.Name, "died!")
            -- Respawn after 5 seconds
            task.wait(5)
            player:LoadCharacter()
        end)
    end)

    -- Handle players already connected if script runs late
    if player.Character then
        -- Character already exists, handle it
    end
end)

-- Fires when a player leaves
Players.PlayerRemoving:Connect(function(player)
    print(player.Name, "left!")
    -- Save data, clean up, etc.
end)

-- IMPORTANT: Handle players who joined before the script ran
for _, player in Players:GetPlayers() do
    -- Same setup as PlayerAdded
end
\`\`\`

## Spawn Location Control
\`\`\`lua
-- Use SpawnLocation parts in Workspace
-- Set their TeamColor to restrict by team
-- Or control programmatically:
player.RespawnLocation = workspace.Checkpoints.Checkpoint3

-- Force respawn at specific position
player.CharacterAdded:Connect(function(character)
    task.wait() -- wait one frame for character to load
    character:PivotTo(CFrame.new(0, 10, 0))
end)
\`\`\`

## Character Properties
\`\`\`lua
player.CharacterAdded:Connect(function(character)
    local humanoid = character:WaitForChild("Humanoid")

    -- Movement
    humanoid.WalkSpeed = 16      -- default walk speed
    humanoid.JumpHeight = 7.2    -- default jump height (preferred)
    humanoid.JumpPower = 50      -- alternative to JumpHeight

    -- Health
    humanoid.MaxHealth = 100
    humanoid.Health = 100

    -- Other
    humanoid.AutoRotate = true   -- face movement direction
    humanoid.UseJumpPower = false -- use JumpHeight instead
end)
\`\`\``,
    },

    {
      id: 'pattern:round-game-loop',
      title: 'Round-Based Game Loop Pattern',
      category: 'pattern',
      tags: ['round', 'gameloop', 'intermission', 'timer', 'game', 'scripting', 'architecture'],
      content: `# Round-Based Game Loop

A common pattern for competitive/round-based games.

## Server Script
\`\`\`lua
-- ServerScriptService/GameLoop.lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local statusRemote = Instance.new("RemoteEvent")
statusRemote.Name = "GameStatus"
statusRemote.Parent = ReplicatedStorage

local INTERMISSION_TIME = 15
local ROUND_TIME = 120
local MIN_PLAYERS = 2

local function get_alive_players()
    local alive = {}
    for _, player in Players:GetPlayers() do
        local character = player.Character
        if character then
            local humanoid = character:FindFirstChildOfClass("Humanoid")
            if humanoid and humanoid.Health > 0 then
                table.insert(alive, player)
            end
        end
    end
    return alive
end

local function teleport_players(players, spawns)
    for i, player in players do
        local character = player.Character
        if character then
            local spawnIndex = ((i - 1) % #spawns) + 1
            character:PivotTo(spawns[spawnIndex].CFrame + Vector3.new(0, 5, 0))
        end
    end
end

local function broadcast_status(message)
    statusRemote:FireAllClients(message)
end

-- Main game loop
while true do
    -- INTERMISSION
    broadcast_status("Intermission")
    for i = INTERMISSION_TIME, 1, -1 do
        broadcast_status("Intermission: " .. i .. "s")
        task.wait(1)
    end

    -- Check enough players
    if #Players:GetPlayers() < MIN_PLAYERS then
        broadcast_status("Need at least " .. MIN_PLAYERS .. " players!")
        task.wait(5)
        continue
    end

    -- ROUND START
    local spawns = workspace.ArenaSpawns:GetChildren()
    local participants = Players:GetPlayers()
    teleport_players(participants, spawns)
    broadcast_status("Round started! Last one standing wins!")

    -- ROUND TIMER
    local roundOver = false
    for i = ROUND_TIME, 1, -1 do
        broadcast_status("Time: " .. i .. "s | Alive: " .. #get_alive_players())
        task.wait(1)

        local alive = get_alive_players()
        if #alive <= 1 then
            roundOver = true
            if #alive == 1 then
                broadcast_status(alive[1].Name .. " wins!")
                -- Award points
                local leaderstats = alive[1]:FindFirstChild("leaderstats")
                if leaderstats and leaderstats:FindFirstChild("Wins") then
                    leaderstats.Wins.Value += 1
                end
            end
            break
        end
    end

    if not roundOver then
        broadcast_status("Time's up! It's a draw!")
    end

    task.wait(5) -- Show results
end
\`\`\``,
    },

    {
      id: 'pattern:inventory-shop',
      title: 'Inventory and Shop System Pattern',
      category: 'pattern',
      tags: ['inventory', 'shop', 'purchase', 'coins', 'items', 'economy', 'scripting'],
      content: `# Inventory and Shop System

## Shared Config (ReplicatedStorage/Modules/ShopConfig.lua)
\`\`\`lua
local ShopConfig = {}

ShopConfig.Items = {
    Sword = { price = 100, category = "Weapons", description = "A basic sword" },
    Shield = { price = 150, category = "Armor", description = "Blocks damage" },
    SpeedBoost = { price = 200, category = "Powerups", description = "+50% speed for 30s" },
    DoubleJump = { price = 500, category = "Abilities", description = "Jump in mid-air" },
}

return ShopConfig
\`\`\`

## Server Shop Handler
\`\`\`lua
-- ServerScriptService/ShopHandler.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ShopConfig = require(ReplicatedStorage.Modules.ShopConfig)

local purchaseRemote = Instance.new("RemoteFunction")
purchaseRemote.Name = "PurchaseItem"
purchaseRemote.Parent = ReplicatedStorage

-- playerData is your data store cache (see DataStore pattern)
purchaseRemote.OnServerInvoke = function(player, itemName)
    -- Validate item exists
    local item = ShopConfig.Items[itemName]
    if not item then
        return false, "Item does not exist"
    end

    local data = playerData[player]
    if not data then
        return false, "Data not loaded"
    end

    -- Check if already owned
    if table.find(data.inventory, itemName) then
        return false, "Already owned"
    end

    -- Check enough coins
    if data.coins < item.price then
        return false, "Not enough coins"
    end

    -- Process purchase
    data.coins -= item.price
    table.insert(data.inventory, itemName)

    -- Update leaderstats
    local coinStat = player:FindFirstChild("leaderstats")
        and player.leaderstats:FindFirstChild("Coins")
    if coinStat then
        coinStat.Value = data.coins
    end

    return true, "Purchased " .. itemName
end
\`\`\`

## Client Shop UI
\`\`\`lua
-- StarterPlayer/StarterPlayerScripts/ShopClient.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ShopConfig = require(ReplicatedStorage.Modules.ShopConfig)
local purchaseRemote = ReplicatedStorage:WaitForChild("PurchaseItem")

local function buy_item(itemName)
    local success, message = purchaseRemote:InvokeServer(itemName)
    if success then
        -- Update UI to show owned
        print("Bought:", itemName)
    else
        print("Failed:", message)
    end
end
\`\`\``,
    },

    {
      id: 'pattern:combat-system',
      title: 'Combat System - Hitbox Detection, Damage, Health',
      category: 'pattern',
      tags: ['combat', 'hitbox', 'damage', 'health', 'weapon', 'sword', 'fight', 'pvp', 'scripting'],
      content: `# Combat System Pattern

## Server-Side Hitbox Detection
\`\`\`lua
-- ServerScriptService/CombatHandler.lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local attackRemote = Instance.new("RemoteEvent")
attackRemote.Name = "Attack"
attackRemote.Parent = ReplicatedStorage

local SWORD_DAMAGE = 25
local SWORD_RANGE = 8
local ATTACK_COOLDOWN = 0.5

local lastAttack = {}

attackRemote.OnServerEvent:Connect(function(player)
    -- Cooldown check
    local now = tick()
    if lastAttack[player] and now - lastAttack[player] < ATTACK_COOLDOWN then
        return
    end
    lastAttack[player] = now

    local character = player.Character
    if not character then return end
    local hrp = character:FindFirstChild("HumanoidRootPart")
    if not hrp then return end

    -- Server-authoritative hitbox using spatial query
    local overlapParams = OverlapParams.new()
    overlapParams.FilterType = Enum.RaycastFilterType.Exclude
    overlapParams.FilterDescendantsInstances = {character}

    -- Box in front of the player
    local hitboxCFrame = hrp.CFrame * CFrame.new(0, 0, -SWORD_RANGE / 2)
    local hitboxSize = Vector3.new(6, 6, SWORD_RANGE)

    local hits = workspace:GetPartBoundsInBox(hitboxCFrame, hitboxSize, overlapParams)

    local damaged = {}
    for _, part in hits do
        local hitCharacter = part.Parent
        if not hitCharacter then continue end

        local hitHumanoid = hitCharacter:FindFirstChildOfClass("Humanoid")
        if not hitHumanoid then continue end
        if damaged[hitCharacter] then continue end -- don't double-hit

        -- Check it's a different player
        local hitPlayer = Players:GetPlayerFromCharacter(hitCharacter)
        if hitPlayer == player then continue end

        damaged[hitCharacter] = true
        hitHumanoid:TakeDamage(SWORD_DAMAGE)

        -- Visual feedback
        local damageRemote = ReplicatedStorage:FindFirstChild("DamageIndicator")
        if damageRemote then
            damageRemote:FireAllClients(part.Position, SWORD_DAMAGE)
        end
    end
end)
\`\`\`

## Damage Indicator (Client)
\`\`\`lua
-- StarterPlayer/StarterPlayerScripts/DamageIndicator.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local remote = ReplicatedStorage:WaitForChild("DamageIndicator")

remote.OnClientEvent:Connect(function(position, damage)
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(0, 100, 0, 40)
    billboard.StudsOffset = Vector3.new(0, 3, 0)
    billboard.AlwaysOnTop = true

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "-" .. damage
    label.TextColor3 = Color3.new(1, 0, 0)
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = billboard

    local attachment = Instance.new("Attachment")
    attachment.WorldPosition = position
    attachment.Parent = workspace.Terrain
    billboard.Adornee = attachment
    billboard.Parent = attachment

    -- Animate upward and fade
    local tween = TweenService:Create(billboard, TweenInfo.new(1), {
        StudsOffset = Vector3.new(0, 6, 0),
    })
    local fadeTween = TweenService:Create(label, TweenInfo.new(1), {
        TextTransparency = 1,
    })
    tween:Play()
    fadeTween:Play()

    task.delay(1, function()
        billboard:Destroy()
        attachment:Destroy()
    end)
end)
\`\`\``,
    },

    {
      id: 'pattern:obby-checkpoint',
      title: 'Obby Checkpoint System',
      category: 'pattern',
      tags: ['obby', 'checkpoint', 'spawn', 'stage', 'obstacle', 'course', 'scripting'],
      content: `# Obby Checkpoint System

## Server Script
\`\`\`lua
-- ServerScriptService/ObbySystem.lua
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local checkpointStore = DataStoreService:GetDataStore("ObbyCheckpoints_v1")

local checkpoints = workspace.Checkpoints -- Folder with Part children named "1", "2", etc.
local playerStage = {}

Players.PlayerAdded:Connect(function(player)
    -- Load saved stage
    local success, stage = pcall(function()
        return checkpointStore:GetAsync("stage_" .. player.UserId)
    end)
    playerStage[player] = (success and stage) or 1

    -- Create leaderstats
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local stageValue = Instance.new("IntValue")
    stageValue.Name = "Stage"
    stageValue.Value = playerStage[player]
    stageValue.Parent = leaderstats

    -- Set spawn location
    player.CharacterAdded:Connect(function(character)
        task.wait() -- wait for character to fully load
        local spawnPart = checkpoints:FindFirstChild(tostring(playerStage[player]))
        if spawnPart then
            character:PivotTo(spawnPart.CFrame + Vector3.new(0, 5, 0))
        end
    end)
end)

-- Checkpoint touch detection
for _, checkpoint in checkpoints:GetChildren() do
    local stageNum = tonumber(checkpoint.Name)
    if not stageNum then continue end

    checkpoint.Touched:Connect(function(hit)
        local character = hit.Parent
        local player = Players:GetPlayerFromCharacter(character)
        if not player then return end

        -- Only advance to next stage, don't go backwards
        if stageNum > (playerStage[player] or 1) then
            playerStage[player] = stageNum
            player.leaderstats.Stage.Value = stageNum
            player.RespawnLocation = nil -- Will use our custom spawn logic

            -- Save
            pcall(function()
                checkpointStore:SetAsync("stage_" .. player.UserId, stageNum)
            end)
        end
    end)
end

-- Save on leaving
Players.PlayerRemoving:Connect(function(player)
    if playerStage[player] then
        pcall(function()
            checkpointStore:SetAsync("stage_" .. player.UserId, playerStage[player])
        end)
        playerStage[player] = nil
    end
end)
\`\`\`

## Kill Brick Pattern
\`\`\`lua
-- Tag all kill bricks with CollectionService or put them in a folder
local killBricks = workspace.KillBricks:GetChildren()

for _, brick in killBricks do
    brick.Touched:Connect(function(hit)
        local humanoid = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
        if humanoid and humanoid.Health > 0 then
            humanoid.Health = 0
        end
    end)
end
\`\`\`

## Moving Platform
\`\`\`lua
local TweenService = game:GetService("TweenService")

local platform = workspace.MovingPlatform
local startPos = platform.Position
local endPos = startPos + Vector3.new(20, 0, 0)

local tweenInfo = TweenInfo.new(3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
local tween = TweenService:Create(platform, tweenInfo, { Position = endPos })
tween:Play()
\`\`\``,
    },

    {
      id: 'pattern:tween-animation',
      title: 'Tween Animation Patterns (TweenService)',
      category: 'pattern',
      tags: ['tween', 'tweenservice', 'animation', 'interpolation', 'easing', 'movement', 'scripting'],
      content: `# TweenService Animation Patterns

TweenService smoothly interpolates properties over time.

## Basic Tween
\`\`\`lua
local TweenService = game:GetService("TweenService")

-- Tween a part's position and color over 2 seconds
local info = TweenInfo.new(
    2,                          -- Duration (seconds)
    Enum.EasingStyle.Quad,      -- Easing style
    Enum.EasingDirection.Out,   -- Easing direction
    0,                          -- RepeatCount (0 = once, -1 = forever)
    false,                      -- Reverses
    0                           -- DelayTime
)

local goals = {
    Position = Vector3.new(0, 20, 0),
    Color = Color3.fromRGB(255, 0, 0),
}

local tween = TweenService:Create(part, info, goals)
tween:Play()

-- Wait for completion
tween.Completed:Wait()
print("Tween done!")
\`\`\`

## Common Easing Styles
- **Linear**: Constant speed
- **Quad/Cubic**: Smooth acceleration
- **Sine**: Gentle, natural movement
- **Bounce**: Bouncy effect at end
- **Elastic**: Spring-like overshoot
- **Back**: Slight overshoot then settle
- **Exponential**: Very fast acceleration

## Door Opening
\`\`\`lua
local function open_door(door)
    local tween = TweenService:Create(door, TweenInfo.new(1, Enum.EasingStyle.Quad), {
        CFrame = door.CFrame * CFrame.Angles(0, math.rad(90), 0)
    })
    tween:Play()
end
\`\`\`

## Fade In/Out
\`\`\`lua
-- Fade out all parts in a model
local function fade_out(model, duration)
    for _, part in model:GetDescendants() do
        if part:IsA("BasePart") then
            TweenService:Create(part, TweenInfo.new(duration), {
                Transparency = 1,
            }):Play()
        end
    end
end
\`\`\`

## Looping Hover Effect
\`\`\`lua
local info = TweenInfo.new(1.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
local tween = TweenService:Create(part, info, {
    Position = part.Position + Vector3.new(0, 3, 0),
})
tween:Play()
\`\`\`

## Chain Tweens (Sequence)
\`\`\`lua
local function tween_sequence(part, steps)
    for _, step in steps do
        local tween = TweenService:Create(part, step.info, step.goals)
        tween:Play()
        tween.Completed:Wait()
    end
end

tween_sequence(part, {
    { info = TweenInfo.new(1), goals = { Position = Vector3.new(0, 10, 0) } },
    { info = TweenInfo.new(0.5), goals = { Size = Vector3.new(8, 8, 8) } },
    { info = TweenInfo.new(1), goals = { Position = Vector3.new(0, 0, 0), Size = Vector3.new(4, 4, 4) } },
})
\`\`\`

## UI Tween
\`\`\`lua
-- Slide a GUI frame in from the left
local frame = script.Parent.Frame
frame.Position = UDim2.new(-1, 0, 0.5, 0) -- start off screen
TweenService:Create(frame, TweenInfo.new(0.5, Enum.EasingStyle.Back), {
    Position = UDim2.new(0.5, 0, 0.5, 0),
}):Play()
\`\`\``,
    },

    {
      id: 'pattern:input-handling',
      title: 'Input Handling - UserInputService and ContextActionService',
      category: 'pattern',
      tags: ['input', 'keyboard', 'mouse', 'mobile', 'touch', 'userinputservice', 'contextactionservice', 'scripting'],
      content: `# Input Handling

## UserInputService (Client Only)
\`\`\`lua
local UIS = game:GetService("UserInputService")

-- Keyboard input
UIS.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end -- ignore if typing in chat

    if input.KeyCode == Enum.KeyCode.E then
        print("E pressed - interact!")
    elseif input.KeyCode == Enum.KeyCode.F then
        print("F pressed - flashlight!")
    elseif input.KeyCode == Enum.KeyCode.LeftShift then
        -- Sprint
        local humanoid = game.Players.LocalPlayer.Character
            and game.Players.LocalPlayer.Character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            humanoid.WalkSpeed = 32
        end
    end
end)

UIS.InputEnded:Connect(function(input, gameProcessed)
    if input.KeyCode == Enum.KeyCode.LeftShift then
        local humanoid = game.Players.LocalPlayer.Character
            and game.Players.LocalPlayer.Character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            humanoid.WalkSpeed = 16 -- back to normal
        end
    end
end)

-- Mouse click
UIS.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        print("Left click!")
    end
end)

-- Device detection
print("Keyboard:", UIS.KeyboardEnabled)
print("Touch:", UIS.TouchEnabled)
print("Gamepad:", UIS.GamepadEnabled)
\`\`\`

## ContextActionService (Preferred for Game Actions)
\`\`\`lua
local CAS = game:GetService("ContextActionService")

-- Binds an action that works on keyboard AND creates a mobile button
CAS:BindAction("Sprint", function(actionName, inputState, inputObject)
    local humanoid = game.Players.LocalPlayer.Character
        and game.Players.LocalPlayer.Character:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    if inputState == Enum.UserInputState.Begin then
        humanoid.WalkSpeed = 32
    elseif inputState == Enum.UserInputState.End then
        humanoid.WalkSpeed = 16
    end
end, true, Enum.KeyCode.LeftShift) -- true = create touch button

-- Customize the touch button
CAS:SetPosition("Sprint", UDim2.new(0.7, 0, 0.5, 0))
CAS:SetTitle("Sprint", "Run")

-- Unbind when done
CAS:UnbindAction("Sprint")
\`\`\`

## ProximityPrompt (E to Interact)
\`\`\`lua
-- Add ProximityPrompt to a part in the workspace
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open"
prompt.ObjectText = "Treasure Chest"
prompt.KeyboardKeyCode = Enum.KeyCode.E
prompt.HoldDuration = 0
prompt.MaxActivationDistance = 10
prompt.Parent = workspace.TreasureChest

-- Server-side handler
prompt.Triggered:Connect(function(player)
    print(player.Name, "opened the chest!")
    -- Give reward, play animation, etc.
end)
\`\`\``,
    },

    // ═══════════════════════════════════════════════════════════════
    // VISUAL / VFX PATTERNS
    // ═══════════════════════════════════════════════════════════════

    {
      id: 'pattern:lighting-setup',
      title: 'Lighting Setup - Atmosphere, Sky, Post-Processing',
      category: 'pattern',
      tags: ['lighting', 'atmosphere', 'sky', 'colorcorrection', 'bloom', 'depthoffield', 'sunrays', 'vfx', 'visual'],
      content: `# Lighting Setup

## Core Lighting Properties
\`\`\`lua
local Lighting = game:GetService("Lighting")

-- Time of day (0-24 hours)
Lighting.ClockTime = 14           -- 2 PM (bright day)
Lighting.ClockTime = 6            -- sunrise
Lighting.ClockTime = 0            -- midnight

-- Core settings
Lighting.Brightness = 2           -- sun brightness
Lighting.Ambient = Color3.fromRGB(70, 70, 70)      -- shadow color
Lighting.OutdoorAmbient = Color3.fromRGB(100, 100, 100)
Lighting.GlobalShadows = true
Lighting.EnvironmentDiffuseScale = 1  -- how much sky affects lighting
Lighting.EnvironmentSpecularScale = 1 -- reflections from sky
Lighting.Technology = Enum.Technology.Future -- best lighting quality
\`\`\`

## Atmosphere (Fog and Sky Color)
\`\`\`lua
local atmosphere = Instance.new("Atmosphere")
atmosphere.Density = 0.3           -- fog thickness (0-1)
atmosphere.Offset = 0.25           -- where fog starts
atmosphere.Color = Color3.fromRGB(199, 210, 225)  -- fog color
atmosphere.Decay = Color3.fromRGB(92, 125, 175)   -- far fog color
atmosphere.Glare = 0               -- sun glare
atmosphere.Haze = 1                -- sky haze
atmosphere.Parent = Lighting
\`\`\`

## Sky
\`\`\`lua
local sky = Instance.new("Sky")
sky.SkyboxBk = "rbxassetid://..."  -- back face
sky.SkyboxDn = "rbxassetid://..."  -- down face
sky.SkyboxFt = "rbxassetid://..."  -- front face
sky.SkyboxLf = "rbxassetid://..."  -- left face
sky.SkyboxRt = "rbxassetid://..."  -- right face
sky.SkyboxUp = "rbxassetid://..."  -- up face
sky.StarCount = 3000
sky.MoonSize = 11
sky.SunAngularSize = 21
sky.Parent = Lighting
\`\`\`

## Post-Processing Effects
\`\`\`lua
-- Bloom (glow on bright surfaces)
local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.5
bloom.Size = 24
bloom.Threshold = 0.9
bloom.Parent = Lighting

-- Color Correction
local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0.05
cc.Contrast = 0.1
cc.Saturation = 0.2
cc.TintColor = Color3.fromRGB(255, 240, 230) -- warm tint
cc.Parent = Lighting

-- Depth of Field
local dof = Instance.new("DepthOfFieldEffect")
dof.FarIntensity = 0.3
dof.FocusDistance = 50
dof.InFocusRadius = 30
dof.NearIntensity = 0
dof.Parent = Lighting

-- Sun Rays
local sunRays = Instance.new("SunRaysEffect")
sunRays.Intensity = 0.1
sunRays.Spread = 0.5
sunRays.Parent = Lighting
\`\`\`

## Day/Night Cycle
\`\`\`lua
-- Server Script
local Lighting = game:GetService("Lighting")
local MINUTES_PER_DAY = 12 -- real minutes for one in-game day

while true do
    Lighting.ClockTime += 24 / (MINUTES_PER_DAY * 60)
    if Lighting.ClockTime >= 24 then
        Lighting.ClockTime = 0
    end
    task.wait(1)
end
\`\`\``,
    },

    {
      id: 'pattern:particle-effects',
      title: 'ParticleEmitter Recipes - Fire, Smoke, Magic, Rain, Snow',
      category: 'pattern',
      tags: ['particle', 'particleemitter', 'fire', 'smoke', 'magic', 'rain', 'snow', 'explosion', 'vfx', 'visual'],
      content: `# ParticleEmitter Recipes

ParticleEmitters are attached to Parts or Attachments. Here are ready-to-use recipes.

## Fire
\`\`\`lua
local fire = Instance.new("ParticleEmitter")
fire.Texture = "rbxassetid://296874871" -- default fire texture
fire.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 200, 0)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 80, 0)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(60, 0, 0)),
})
fire.Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 2),
    NumberSequenceKeypoint.new(1, 0),
})
fire.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.3),
    NumberSequenceKeypoint.new(1, 1),
})
fire.Lifetime = NumberRange.new(0.5, 1)
fire.Rate = 50
fire.Speed = NumberRange.new(5, 10)
fire.SpreadAngle = Vector2.new(15, 15)
fire.LightEmission = 1
fire.LightInfluence = 0
fire.Parent = part
\`\`\`

## Smoke
\`\`\`lua
local smoke = Instance.new("ParticleEmitter")
smoke.Texture = "rbxassetid://1084981800" -- cloud texture
smoke.Color = ColorSequence.new(Color3.fromRGB(100, 100, 100))
smoke.Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 1),
    NumberSequenceKeypoint.new(1, 8),
})
smoke.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.5),
    NumberSequenceKeypoint.new(1, 1),
})
smoke.Lifetime = NumberRange.new(3, 5)
smoke.Rate = 15
smoke.Speed = NumberRange.new(2, 4)
smoke.SpreadAngle = Vector2.new(30, 30)
smoke.Rotation = NumberRange.new(0, 360)
smoke.RotSpeed = NumberRange.new(-30, 30)
smoke.Parent = part
\`\`\`

## Magic Sparkles
\`\`\`lua
local sparkle = Instance.new("ParticleEmitter")
sparkle.Texture = "rbxassetid://2273224484" -- sparkle texture
sparkle.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(100, 0, 255)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 200, 255)),
})
sparkle.Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0),
    NumberSequenceKeypoint.new(0.3, 1),
    NumberSequenceKeypoint.new(1, 0),
})
sparkle.Transparency = NumberSequence.new(0)
sparkle.Lifetime = NumberRange.new(0.5, 1.5)
sparkle.Rate = 30
sparkle.Speed = NumberRange.new(3, 6)
sparkle.SpreadAngle = Vector2.new(360, 360)
sparkle.LightEmission = 1
sparkle.Parent = part
\`\`\`

## Rain (Attach to player's head area)
\`\`\`lua
local rain = Instance.new("ParticleEmitter")
rain.Texture = "rbxassetid://241685484" -- raindrop
rain.Color = ColorSequence.new(Color3.fromRGB(180, 200, 220))
rain.Size = NumberSequence.new(0.1, 0.1)
rain.Transparency = NumberSequence.new(0.3)
rain.Lifetime = NumberRange.new(0.5, 1)
rain.Rate = 200
rain.Speed = NumberRange.new(50, 60)
rain.SpreadAngle = Vector2.new(10, 10)
rain.EmissionDirection = Enum.NormalId.Bottom
rain.Acceleration = Vector3.new(0, -50, 0)
rain.Parent = attachment -- attach to a part above the scene
\`\`\`

## Explosion Burst (One-shot)
\`\`\`lua
local function create_explosion(position)
    local att = Instance.new("Attachment")
    att.WorldPosition = position
    att.Parent = workspace.Terrain

    local burst = Instance.new("ParticleEmitter")
    burst.Texture = "rbxassetid://296874871"
    burst.Color = ColorSequence.new(Color3.fromRGB(255, 150, 0))
    burst.Size = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 5),
        NumberSequenceKeypoint.new(1, 15),
    })
    burst.Transparency = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 0),
        NumberSequenceKeypoint.new(1, 1),
    })
    burst.Lifetime = NumberRange.new(0.3, 0.8)
    burst.Speed = NumberRange.new(20, 40)
    burst.SpreadAngle = Vector2.new(360, 360)
    burst.LightEmission = 1
    burst.Enabled = false -- don't auto-emit
    burst.Parent = att

    burst:Emit(50) -- emit 50 particles at once
    task.delay(1, function() att:Destroy() end)
end
\`\`\``,
    },

    {
      id: 'pattern:beam-trail-effects',
      title: 'Beam and Trail Effects - Lasers, Lightning, Sword Trails',
      category: 'pattern',
      tags: ['beam', 'trail', 'laser', 'lightning', 'sword', 'slash', 'vfx', 'visual', 'effect'],
      content: `# Beam and Trail Effects

## Beam (Between Two Points)
\`\`\`lua
-- Beams connect two Attachments
local att0 = Instance.new("Attachment")
att0.Parent = partA
local att1 = Instance.new("Attachment")
att1.Parent = partB

local beam = Instance.new("Beam")
beam.Attachment0 = att0
beam.Attachment1 = att1
beam.Width0 = 2
beam.Width1 = 2
beam.Color = ColorSequence.new(Color3.fromRGB(0, 170, 255))
beam.LightEmission = 1
beam.FaceCamera = true
beam.Transparency = NumberSequence.new(0)
beam.Parent = partA
\`\`\`

## Laser Beam
\`\`\`lua
local function create_laser(origin, target)
    local att0 = Instance.new("Attachment")
    att0.WorldPosition = origin
    att0.Parent = workspace.Terrain

    local att1 = Instance.new("Attachment")
    att1.WorldPosition = target
    att1.Parent = workspace.Terrain

    local beam = Instance.new("Beam")
    beam.Attachment0 = att0
    beam.Attachment1 = att1
    beam.Width0 = 0.5
    beam.Width1 = 0.5
    beam.Color = ColorSequence.new(Color3.fromRGB(255, 0, 0))
    beam.LightEmission = 1
    beam.FaceCamera = true
    beam.Segments = 1 -- straight line
    beam.Parent = att0

    -- Flash and disappear
    task.delay(0.1, function()
        beam.Transparency = NumberSequence.new(0.5)
        task.delay(0.1, function()
            att0:Destroy()
            att1:Destroy()
        end)
    end)
end
\`\`\`

## Lightning Effect
\`\`\`lua
local function create_lightning(start, finish)
    local att0 = Instance.new("Attachment")
    att0.WorldPosition = start
    att0.Parent = workspace.Terrain

    local att1 = Instance.new("Attachment")
    att1.WorldPosition = finish
    att1.Parent = workspace.Terrain

    local beam = Instance.new("Beam")
    beam.Attachment0 = att0
    beam.Attachment1 = att1
    beam.Width0 = 1
    beam.Width1 = 0.5
    beam.Color = ColorSequence.new(Color3.fromRGB(170, 200, 255))
    beam.LightEmission = 1
    beam.FaceCamera = true
    beam.Segments = 15       -- more segments = more jagged
    beam.CurveSize0 = 5     -- curvature
    beam.CurveSize1 = -3
    beam.TextureMode = Enum.TextureMode.Stretch
    beam.Parent = att0

    task.delay(0.15, function()
        att0:Destroy()
        att1:Destroy()
    end)
end
\`\`\`

## Trail Effect (Sword Slash)
\`\`\`lua
-- Trails need two Attachments on the same part
local handle = tool.Handle

local att0 = Instance.new("Attachment")
att0.Position = Vector3.new(0, -1, 0)  -- bottom of blade
att0.Parent = handle

local att1 = Instance.new("Attachment")
att1.Position = Vector3.new(0, 2, 0)   -- top of blade
att1.Parent = handle

local trail = Instance.new("Trail")
trail.Attachment0 = att0
trail.Attachment1 = att1
trail.Lifetime = 0.3
trail.MinLength = 0.1
trail.FaceCamera = true
trail.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(100, 100, 255)),
})
trail.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0),
    NumberSequenceKeypoint.new(1, 1),
})
trail.WidthScale = NumberSequence.new(1)
trail.LightEmission = 0.5
trail.Parent = handle
\`\`\`

## Neon Glow Effect
\`\`\`lua
-- Parts with Neon material emit light
local glowPart = Instance.new("Part")
glowPart.Material = Enum.Material.Neon
glowPart.Color = Color3.fromRGB(0, 170, 255) -- blue glow
glowPart.Size = Vector3.new(1, 1, 1)
glowPart.Anchored = true
glowPart.Parent = workspace

-- Add PointLight for additional glow
local light = Instance.new("PointLight")
light.Color = Color3.fromRGB(0, 170, 255)
light.Range = 15
light.Brightness = 3
light.Parent = glowPart
\`\`\``,
    },

    // ═══════════════════════════════════════════════════════════════
    // UI PATTERNS
    // ═══════════════════════════════════════════════════════════════

    {
      id: 'pattern:screengui-hierarchy',
      title: 'ScreenGui Hierarchy and Layout',
      category: 'pattern',
      tags: ['gui', 'screengui', 'ui', 'layout', 'uilistlayout', 'uigridlayout', 'uiaspectratioconstraint', 'visual'],
      content: `# ScreenGui Hierarchy and Layout

## Basic ScreenGui Setup
\`\`\`lua
-- StarterGui/MyGui (ScreenGui)
-- ScreenGuis in StarterGui are cloned to each player's PlayerGui

local gui = Instance.new("ScreenGui")
gui.Name = "HUD"
gui.ResetOnSpawn = false  -- persist through respawns
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling  -- recommended
gui.DisplayOrder = 1  -- higher = renders on top of other GUIs
gui.Parent = player.PlayerGui
\`\`\`

## Frame with UIListLayout
\`\`\`lua
local container = Instance.new("Frame")
container.Size = UDim2.new(0.3, 0, 0.5, 0) -- 30% width, 50% height
container.Position = UDim2.new(0.35, 0, 0.25, 0)
container.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
container.BackgroundTransparency = 0.3
container.BorderSizePixel = 0
container.Parent = gui

-- Add corner rounding
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 12)
corner.Parent = container

-- Auto-layout children vertically
local layout = Instance.new("UIListLayout")
layout.FillDirection = Enum.FillDirection.Vertical
layout.Padding = UDim.new(0, 8)
layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = container

-- Padding inside the container
local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 16)
padding.PaddingBottom = UDim.new(0, 16)
padding.PaddingLeft = UDim.new(0, 16)
padding.PaddingRight = UDim.new(0, 16)
padding.Parent = container
\`\`\`

## Grid Layout
\`\`\`lua
local grid = Instance.new("UIGridLayout")
grid.CellSize = UDim2.new(0, 64, 0, 64) -- each cell is 64x64
grid.CellPadding = UDim2.new(0, 8, 0, 8)
grid.FillDirection = Enum.FillDirection.Horizontal
grid.FillDirectionMaxCells = 4 -- 4 columns
grid.SortOrder = Enum.SortOrder.LayoutOrder
grid.Parent = container
\`\`\`

## Responsive with UIAspectRatioConstraint
\`\`\`lua
-- Maintains aspect ratio regardless of screen size
local aspect = Instance.new("UIAspectRatioConstraint")
aspect.AspectRatio = 16 / 9
aspect.AspectType = Enum.AspectType.FitWithinMaxSize
aspect.Parent = frame
\`\`\`

## UIScale (Responsive Scaling)
\`\`\`lua
-- Scale entire GUI based on screen size
local scale = Instance.new("UIScale")
scale.Scale = math.min(workspace.CurrentCamera.ViewportSize.X / 1920, 1)
scale.Parent = gui

-- Update on resize
workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(function()
    scale.Scale = math.min(workspace.CurrentCamera.ViewportSize.X / 1920, 1)
end)
\`\`\`

## ScrollingFrame
\`\`\`lua
local scrollFrame = Instance.new("ScrollingFrame")
scrollFrame.Size = UDim2.new(1, 0, 1, 0)
scrollFrame.CanvasSize = UDim2.new(0, 0, 0, 0) -- auto-size with layout
scrollFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
scrollFrame.ScrollBarThickness = 6
scrollFrame.BackgroundTransparency = 1
scrollFrame.Parent = container
\`\`\``,
    },

    {
      id: 'pattern:billboardgui',
      title: 'BillboardGui - In-World UI Elements',
      category: 'pattern',
      tags: ['billboardgui', 'worldui', 'nametag', 'healthbar', 'label', 'ui', 'visual'],
      content: `# BillboardGui - UI in 3D World

BillboardGuis face the camera and are attached to parts.

## Player Nametag
\`\`\`lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        local head = character:WaitForChild("Head")

        local billboard = Instance.new("BillboardGui")
        billboard.Size = UDim2.new(0, 200, 0, 50)
        billboard.StudsOffset = Vector3.new(0, 2, 0) -- above head
        billboard.AlwaysOnTop = false
        billboard.MaxDistance = 50 -- hide beyond 50 studs
        billboard.Adornee = head
        billboard.Parent = head

        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 1, 0)
        label.BackgroundTransparency = 1
        label.Text = player.Name
        label.TextColor3 = Color3.new(1, 1, 1)
        label.TextStrokeTransparency = 0.5
        label.TextScaled = true
        label.Font = Enum.Font.GothamBold
        label.Parent = billboard
    end)
end)
\`\`\`

## Custom Health Bar (Above Character)
\`\`\`lua
player.CharacterAdded:Connect(function(character)
    local head = character:WaitForChild("Head")
    local humanoid = character:WaitForChild("Humanoid")

    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(0, 120, 0, 12)
    billboard.StudsOffset = Vector3.new(0, 3, 0)
    billboard.AlwaysOnTop = false
    billboard.Parent = head

    -- Background
    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, 0, 1, 0)
    bg.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    bg.BorderSizePixel = 0
    bg.Parent = billboard
    Instance.new("UICorner", bg).CornerRadius = UDim.new(1, 0)

    -- Health fill
    local fill = Instance.new("Frame")
    fill.Size = UDim2.new(1, 0, 1, 0)
    fill.BackgroundColor3 = Color3.fromRGB(0, 200, 0)
    fill.BorderSizePixel = 0
    fill.Parent = bg
    Instance.new("UICorner", fill).CornerRadius = UDim.new(1, 0)

    humanoid.HealthChanged:Connect(function(health)
        local pct = health / humanoid.MaxHealth
        fill.Size = UDim2.new(pct, 0, 1, 0)
        if pct > 0.5 then
            fill.BackgroundColor3 = Color3.fromRGB(0, 200, 0)
        elseif pct > 0.25 then
            fill.BackgroundColor3 = Color3.fromRGB(255, 200, 0)
        else
            fill.BackgroundColor3 = Color3.fromRGB(255, 0, 0)
        end
    end)
end)
\`\`\`

## Floating Damage Number
\`\`\`lua
local function show_damage(position, amount)
    local bb = Instance.new("BillboardGui")
    bb.Size = UDim2.new(0, 80, 0, 30)
    bb.StudsOffset = Vector3.new(math.random(-2, 2), 2, 0)
    bb.AlwaysOnTop = true

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "-" .. amount
    label.TextColor3 = Color3.new(1, 0.2, 0.2)
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = bb

    local att = Instance.new("Attachment")
    att.WorldPosition = position
    att.Parent = workspace.Terrain
    bb.Adornee = att
    bb.Parent = att

    -- Animate: float up + fade
    local TweenService = game:GetService("TweenService")
    TweenService:Create(bb, TweenInfo.new(1.2), { StudsOffset = Vector3.new(0, 5, 0) }):Play()
    TweenService:Create(label, TweenInfo.new(1.2), { TextTransparency = 1 }):Play()

    task.delay(1.3, function() att:Destroy() end)
end
\`\`\``,
    },

    {
      id: 'pattern:button-styling',
      title: 'Button Styling and Hover Effects',
      category: 'pattern',
      tags: ['button', 'textbutton', 'imagebutton', 'hover', 'click', 'style', 'ui', 'visual'],
      content: `# Button Styling and Hover Effects

## Styled Text Button
\`\`\`lua
local TweenService = game:GetService("TweenService")

local function create_button(parent, text, position)
    local btn = Instance.new("TextButton")
    btn.Size = UDim2.new(0, 200, 0, 50)
    btn.Position = position
    btn.AnchorPoint = Vector2.new(0.5, 0.5)
    btn.Text = text
    btn.TextColor3 = Color3.new(1, 1, 1)
    btn.TextSize = 18
    btn.Font = Enum.Font.GothamBold
    btn.BackgroundColor3 = Color3.fromRGB(0, 120, 215)
    btn.BorderSizePixel = 0
    btn.AutoButtonColor = false -- we handle hover ourselves
    btn.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = btn

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(60, 160, 255)
    stroke.Thickness = 2
    stroke.Transparency = 0.5
    stroke.Parent = btn

    -- Hover effect
    local normalColor = Color3.fromRGB(0, 120, 215)
    local hoverColor = Color3.fromRGB(30, 150, 240)
    local pressColor = Color3.fromRGB(0, 80, 160)

    btn.MouseEnter:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.15), {
            BackgroundColor3 = hoverColor,
            Size = UDim2.new(0, 210, 0, 54),
        }):Play()
    end)

    btn.MouseLeave:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.15), {
            BackgroundColor3 = normalColor,
            Size = UDim2.new(0, 200, 0, 50),
        }):Play()
    end)

    btn.MouseButton1Down:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.05), {
            BackgroundColor3 = pressColor,
            Size = UDim2.new(0, 195, 0, 48),
        }):Play()
    end)

    btn.MouseButton1Up:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.1), {
            BackgroundColor3 = hoverColor,
            Size = UDim2.new(0, 210, 0, 54),
        }):Play()
    end)

    return btn
end
\`\`\`

## Dialog System
\`\`\`lua
local function show_dialog(player, title, message, options)
    local gui = player.PlayerGui
    local screen = Instance.new("ScreenGui")
    screen.Name = "DialogGui"
    screen.Parent = gui

    -- Background overlay
    local overlay = Instance.new("Frame")
    overlay.Size = UDim2.new(1, 0, 1, 0)
    overlay.BackgroundColor3 = Color3.new(0, 0, 0)
    overlay.BackgroundTransparency = 0.5
    overlay.Parent = screen

    -- Dialog box
    local dialog = Instance.new("Frame")
    dialog.Size = UDim2.new(0, 400, 0, 250)
    dialog.Position = UDim2.new(0.5, 0, 0.5, 0)
    dialog.AnchorPoint = Vector2.new(0.5, 0.5)
    dialog.BackgroundColor3 = Color3.fromRGB(35, 35, 40)
    dialog.Parent = screen
    Instance.new("UICorner", dialog).CornerRadius = UDim.new(0, 12)

    -- Title
    local titleLabel = Instance.new("TextLabel")
    titleLabel.Size = UDim2.new(1, -32, 0, 40)
    titleLabel.Position = UDim2.new(0, 16, 0, 16)
    titleLabel.BackgroundTransparency = 1
    titleLabel.Text = title
    titleLabel.TextColor3 = Color3.new(1, 1, 1)
    titleLabel.TextSize = 22
    titleLabel.Font = Enum.Font.GothamBold
    titleLabel.TextXAlignment = Enum.TextXAlignment.Left
    titleLabel.Parent = dialog

    -- Message
    local msgLabel = Instance.new("TextLabel")
    msgLabel.Size = UDim2.new(1, -32, 0, 100)
    msgLabel.Position = UDim2.new(0, 16, 0, 60)
    msgLabel.BackgroundTransparency = 1
    msgLabel.Text = message
    msgLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    msgLabel.TextSize = 16
    msgLabel.Font = Enum.Font.Gotham
    msgLabel.TextWrapped = true
    msgLabel.TextXAlignment = Enum.TextXAlignment.Left
    msgLabel.TextYAlignment = Enum.TextYAlignment.Top
    msgLabel.Parent = dialog

    -- Option buttons at bottom
    for i, option in options do
        local btn = Instance.new("TextButton")
        btn.Size = UDim2.new(0, 120, 0, 36)
        btn.Position = UDim2.new(1, -16 - (120 + 8) * (#options - i + 1), 1, -16 - 36)
        btn.Text = option
        btn.TextColor3 = Color3.new(1, 1, 1)
        btn.BackgroundColor3 = Color3.fromRGB(0, 120, 215)
        btn.BorderSizePixel = 0
        btn.Font = Enum.Font.GothamBold
        btn.TextSize = 14
        btn.Parent = dialog
        Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 6)

        btn.MouseButton1Click:Connect(function()
            screen:Destroy()
        end)
    end

    return screen
end
\`\`\``,
    },

    // ═══════════════════════════════════════════════════════════════
    // GAME ARCHITECTURE PATTERNS
    // ═══════════════════════════════════════════════════════════════

    {
      id: 'pattern:obby-game-template',
      title: 'Complete Obby Game Template',
      category: 'pattern',
      tags: ['obby', 'obstacle', 'course', 'game', 'template', 'architecture', 'complete'],
      content: `# Complete Obby Game Template

## Game Structure
\`\`\`
Workspace/
  Stages/
    Stage1/ (Folder)
      Spawn (SpawnLocation)
      Platform1 (Part)
      Platform2 (Part)
      KillBrick (Part) -- colored red
      Checkpoint (Part) -- colored green
    Stage2/
      ...
  KillZone (Part at Y=-50, very large, kills on touch)

ServerScriptService/
  ObbyServer.lua

StarterGui/
  StageGui (ScreenGui)
\`\`\`

## Server Script (ObbyServer.lua)
\`\`\`lua
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local stageStore = DataStoreService:GetDataStore("ObbyStages_v1")

local stages = workspace.Stages
local stageCount = #stages:GetChildren()

local playerData = {}

Players.PlayerAdded:Connect(function(player)
    -- Load stage
    local success, savedStage = pcall(function()
        return stageStore:GetAsync(tostring(player.UserId))
    end)
    local currentStage = (success and savedStage) or 1
    playerData[player] = { stage = currentStage }

    -- Leaderstats
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local stageVal = Instance.new("IntValue")
    stageVal.Name = "Stage"
    stageVal.Value = currentStage
    stageVal.Parent = ls

    -- Spawn at current stage
    player.CharacterAdded:Connect(function(character)
        task.wait(0.1)
        local stageName = "Stage" .. currentStage
        local stageFolder = stages:FindFirstChild(stageName)
        if stageFolder then
            local spawn = stageFolder:FindFirstChild("Spawn")
                or stageFolder:FindFirstChildOfClass("SpawnLocation")
                or stageFolder:GetChildren()[1]
            if spawn then
                character:PivotTo(spawn.CFrame + Vector3.new(0, 5, 0))
            end
        end
    end)
end)

-- Setup checkpoint and kill brick detection
for _, stageFolder in stages:GetChildren() do
    local stageNum = tonumber(stageFolder.Name:match("%d+"))
    if not stageNum then continue end

    for _, part in stageFolder:GetDescendants() do
        if part:IsA("BasePart") then
            -- Kill bricks (red parts or named "KillBrick")
            if part.Name == "KillBrick" or part.BrickColor == BrickColor.new("Really red") then
                part.Touched:Connect(function(hit)
                    local hum = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
                    if hum and hum.Health > 0 then
                        hum.Health = 0
                    end
                end)
            end

            -- Checkpoints (green parts or named "Checkpoint")
            if part.Name == "Checkpoint" or part.BrickColor == BrickColor.new("Lime green") then
                part.Touched:Connect(function(hit)
                    local character = hit.Parent
                    local player = Players:GetPlayerFromCharacter(character)
                    if not player or not playerData[player] then return end

                    if stageNum > playerData[player].stage then
                        playerData[player].stage = stageNum
                        player.leaderstats.Stage.Value = stageNum

                        -- Save
                        pcall(function()
                            stageStore:SetAsync(tostring(player.UserId), stageNum)
                        end)
                    end
                end)
            end
        end
    end
end

-- Kill zone at bottom
workspace.KillZone.Touched:Connect(function(hit)
    local hum = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
    if hum then hum.Health = 0 end
end)

-- Save on leave
Players.PlayerRemoving:Connect(function(player)
    if playerData[player] then
        pcall(function()
            stageStore:SetAsync(tostring(player.UserId), playerData[player].stage)
        end)
        playerData[player] = nil
    end
end)

game:BindToClose(function()
    for _, player in Players:GetPlayers() do
        if playerData[player] then
            pcall(function()
                stageStore:SetAsync(tostring(player.UserId), playerData[player].stage)
            end)
        end
    end
end)
\`\`\``,
    },

    {
      id: 'pattern:tycoon-game-template',
      title: 'Complete Tycoon Game Template',
      category: 'pattern',
      tags: ['tycoon', 'dropper', 'conveyor', 'upgrade', 'rebirth', 'factory', 'game', 'template', 'architecture'],
      content: `# Complete Tycoon Game Template

## Core Tycoon Architecture
\`\`\`lua
-- ServerScriptService/TycoonServer.lua
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local tycoonStore = DataStoreService:GetDataStore("Tycoon_v1")

local TYCOON_TEMPLATE = game:GetService("ServerStorage").TycoonTemplate

local tycoons = {} -- player -> tycoon data

local TYCOON_POSITIONS = {
    CFrame.new(0, 0, 0),
    CFrame.new(100, 0, 0),
    CFrame.new(200, 0, 0),
    CFrame.new(0, 0, 100),
}
local assignedPositions = {}

Players.PlayerAdded:Connect(function(player)
    -- Load data
    local success, data = pcall(function()
        return tycoonStore:GetAsync(tostring(player.UserId))
    end)
    local saveData = (success and data) or { cash = 0, unlocked = {}, rebirth = 0 }

    -- Find available position
    local posIndex = nil
    for i, pos in TYCOON_POSITIONS do
        if not assignedPositions[i] then
            posIndex = i
            assignedPositions[i] = player
            break
        end
    end
    if not posIndex then return end

    -- Clone tycoon template
    local tycoon = TYCOON_TEMPLATE:Clone()
    tycoon:PivotTo(TYCOON_POSITIONS[posIndex])
    tycoon.Name = player.Name .. "_Tycoon"
    tycoon.Parent = workspace

    -- Leaderstats
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local cashVal = Instance.new("IntValue")
    cashVal.Name = "Cash"
    cashVal.Value = saveData.cash
    cashVal.Parent = ls

    tycoons[player] = {
        model = tycoon,
        posIndex = posIndex,
        cash = saveData.cash,
        unlocked = saveData.unlocked or {},
        rebirth = saveData.rebirth or 0,
    }

    -- Setup collector (where items are sold)
    local collector = tycoon:FindFirstChild("Collector", true)
    if collector then
        collector.Touched:Connect(function(hit)
            if hit.Name == "TycoonDrop" and hit:GetAttribute("Owner") == player.Name then
                local value = hit:GetAttribute("Value") or 1
                local multiplier = 1 + (tycoons[player].rebirth * 0.5) -- rebirth bonus
                tycoons[player].cash += math.floor(value * multiplier)
                cashVal.Value = tycoons[player].cash
                hit:Destroy()
            end
        end)
    end

    -- Setup purchase buttons
    for _, btn in tycoon:GetDescendants() do
        if btn.Name == "PurchaseButton" and btn:IsA("BasePart") then
            local cost = btn:GetAttribute("Cost") or 100
            local unlockName = btn:GetAttribute("Unlocks") or ""

            btn.Touched:Connect(function(hit)
                local touchPlayer = Players:GetPlayerFromCharacter(hit.Parent)
                if touchPlayer ~= player then return end
                if tycoons[player].unlocked[unlockName] then return end
                if tycoons[player].cash < cost then return end

                tycoons[player].cash -= cost
                cashVal.Value = tycoons[player].cash
                tycoons[player].unlocked[unlockName] = true

                -- Show the unlocked item
                local item = tycoon:FindFirstChild(unlockName, true)
                if item then
                    item.Transparency = 0
                    item.CanCollide = true
                end
                btn:Destroy()
            end)
        end
    end
end)

-- Dropper loop (spawns items)
task.spawn(function()
    while true do
        task.wait(2) -- drop every 2 seconds
        for player, data in tycoons do
            local dropper = data.model:FindFirstChild("Dropper", true)
            if dropper then
                local drop = Instance.new("Part")
                drop.Name = "TycoonDrop"
                drop.Size = Vector3.new(1, 1, 1)
                drop.Material = Enum.Material.Neon
                drop.Color = Color3.fromRGB(255, 200, 0)
                drop.Position = dropper.Position - Vector3.new(0, 2, 0)
                drop:SetAttribute("Owner", player.Name)
                drop:SetAttribute("Value", 1 + (data.rebirth * 2))
                drop.Parent = workspace
                game:GetService("Debris"):AddItem(drop, 30) -- cleanup after 30s
            end
        end
    end
end)
\`\`\``,
    },

    {
      id: 'pattern:combat-game-template',
      title: 'Complete Combat Game Template',
      category: 'pattern',
      tags: ['combat', 'pvp', 'fight', 'weapon', 'health', 'respawn', 'team', 'game', 'template', 'architecture'],
      content: `# Complete Combat Game Template

## Server Script
\`\`\`lua
-- ServerScriptService/CombatGame.lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

-- Create remotes
local attackRemote = Instance.new("RemoteEvent")
attackRemote.Name = "Attack"
attackRemote.Parent = ReplicatedStorage

local RESPAWN_TIME = 5
local lastAttack = {}

-- Player setup
Players.PlayerAdded:Connect(function(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local kills = Instance.new("IntValue")
    kills.Name = "Kills"
    kills.Value = 0
    kills.Parent = ls

    local deaths = Instance.new("IntValue")
    deaths.Name = "Deaths"
    deaths.Value = 0
    deaths.Parent = ls

    player.CharacterAdded:Connect(function(character)
        local humanoid = character:WaitForChild("Humanoid")
        humanoid.MaxHealth = 100
        humanoid.Health = 100

        -- Give weapon
        local sword = ServerStorage.Weapons.Sword:Clone()
        sword.Parent = character

        -- Track killer
        local lastDamager = nil

        humanoid.HealthChanged:Connect(function(health)
            if health <= 0 and lastDamager then
                local killerStats = lastDamager:FindFirstChild("leaderstats")
                if killerStats then
                    killerStats.Kills.Value += 1
                end
                player.leaderstats.Deaths.Value += 1
                lastDamager = nil
            end
        end)

        -- Store reference for damage attribution
        character:SetAttribute("LastDamager", "")

        humanoid.Died:Connect(function()
            task.wait(RESPAWN_TIME)
            player:LoadCharacter()
        end)
    end)
end)

-- Combat handler
attackRemote.OnServerEvent:Connect(function(player)
    local now = tick()
    if lastAttack[player] and now - lastAttack[player] < 0.4 then return end
    lastAttack[player] = now

    local character = player.Character
    if not character then return end
    local hrp = character:FindFirstChild("HumanoidRootPart")
    if not hrp then return end

    -- Hitbox in front of player
    local params = OverlapParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    params.FilterDescendantsInstances = {character}

    local hitCF = hrp.CFrame * CFrame.new(0, 0, -4)
    local hits = workspace:GetPartBoundsInBox(hitCF, Vector3.new(8, 6, 8), params)

    local damaged = {}
    for _, part in hits do
        local hitChar = part.Parent
        if not hitChar or damaged[hitChar] then continue end

        local hitHum = hitChar:FindFirstChildOfClass("Humanoid")
        if not hitHum or hitHum.Health <= 0 then continue end

        local hitPlayer = Players:GetPlayerFromCharacter(hitChar)
        if hitPlayer == player then continue end

        damaged[hitChar] = true
        hitHum:TakeDamage(25)

        -- Track who damaged them for kill credit
        if hitPlayer then
            hitChar:SetAttribute("LastDamager", player.Name)
        end
    end
end)
\`\`\`

## Sword Tool (Handle + LocalScript)
\`\`\`lua
-- Inside the Tool's LocalScript
local tool = script.Parent
local player = game.Players.LocalPlayer
local remote = game:GetService("ReplicatedStorage"):WaitForChild("Attack")

local debounce = false

tool.Activated:Connect(function()
    if debounce then return end
    debounce = true

    -- Play swing animation
    local character = player.Character
    if character then
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            local anim = Instance.new("Animation")
            anim.AnimationId = "rbxassetid://..." -- sword swing animation
            local track = humanoid:LoadAnimation(anim)
            track:Play()
        end
    end

    remote:FireServer()

    task.wait(0.4)
    debounce = false
end)
\`\`\``,
    },

    {
      id: 'pattern:collectionservice',
      title: 'CollectionService for Tag-Based Systems',
      category: 'pattern',
      tags: ['collectionservice', 'tag', 'tagging', 'system', 'architecture', 'scripting'],
      content: `# CollectionService for Tag-Based Systems

CollectionService lets you tag instances and process them as groups. Much cleaner than searching by name.

## Basic Usage
\`\`\`lua
local CollectionService = game:GetService("CollectionService")

-- Tag parts in Studio (Properties > Tags) or in script:
CollectionService:AddTag(part, "Lava")
CollectionService:AddTag(part, "Interactable")

-- Check if tagged
if CollectionService:HasTag(part, "Lava") then
    print("It's lava!")
end

-- Remove tag
CollectionService:RemoveTag(part, "Lava")
\`\`\`

## Process All Tagged Objects
\`\`\`lua
-- Handle all current and future lava parts
local function setup_lava(part)
    if not part:IsA("BasePart") then return end

    part.Touched:Connect(function(hit)
        local humanoid = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
        if humanoid then
            humanoid:TakeDamage(10)
        end
    end)
end

-- Setup existing
for _, part in CollectionService:GetTagged("Lava") do
    setup_lava(part)
end

-- Setup new ones added later
CollectionService:GetInstanceAddedSignal("Lava"):Connect(setup_lava)
CollectionService:GetInstanceRemovedSignal("Lava"):Connect(function(part)
    -- Cleanup if needed
end)
\`\`\`

## Tag-Based System Examples
\`\`\`lua
-- Coin collection system
local function setup_coin(coin)
    coin.Touched:Connect(function(hit)
        local player = game.Players:GetPlayerFromCharacter(hit.Parent)
        if not player then return end

        local ls = player:FindFirstChild("leaderstats")
        if ls and ls:FindFirstChild("Coins") then
            ls.Coins.Value += coin:GetAttribute("Value") or 1
            coin:Destroy()
        end
    end)
end

for _, c in CollectionService:GetTagged("Coin") do setup_coin(c) end
CollectionService:GetInstanceAddedSignal("Coin"):Connect(setup_coin)

-- Bouncy pad system
local function setup_bouncepad(pad)
    pad.Touched:Connect(function(hit)
        local hrp = hit.Parent and hit.Parent:FindFirstChild("HumanoidRootPart")
        if hrp then
            local force = pad:GetAttribute("BounceForce") or 100
            hrp.AssemblyLinearVelocity = Vector3.new(
                hrp.AssemblyLinearVelocity.X,
                force,
                hrp.AssemblyLinearVelocity.Z
            )
        end
    end)
end

for _, p in CollectionService:GetTagged("BouncePad") do setup_bouncepad(p) end
CollectionService:GetInstanceAddedSignal("BouncePad"):Connect(setup_bouncepad)
\`\`\`

## Debris Service (Cleanup)
\`\`\`lua
local Debris = game:GetService("Debris")

-- Automatically destroy after N seconds
local projectile = Instance.new("Part")
projectile.Parent = workspace
Debris:AddItem(projectile, 5) -- destroyed after 5 seconds

-- Useful for temporary effects, projectiles, dropped items
\`\`\``,
    },

    {
      id: 'pattern:water-effects',
      title: 'Water Effects - Terrain Water and Custom Water',
      category: 'pattern',
      tags: ['water', 'terrain', 'ocean', 'pool', 'swim', 'wave', 'visual', 'vfx'],
      content: `# Water Effects

## Terrain Water
\`\`\`lua
local terrain = workspace.Terrain

-- Fill a pool area with water
terrain:FillBlock(
    CFrame.new(0, -5, 0),
    Vector3.new(100, 10, 100),
    Enum.Material.Water
)

-- Water properties are controlled by Terrain.WaterWaveSize, etc.
terrain.WaterWaveSize = 0.15     -- 0 to 1
terrain.WaterWaveSpeed = 10      -- speed of waves
terrain.WaterTransparency = 0.3  -- how see-through
terrain.WaterReflectance = 0.1   -- reflection amount
terrain.WaterColor = Color3.fromRGB(0, 115, 180)
\`\`\`

## Custom Water Surface (Non-terrain)
\`\`\`lua
-- Use a part with glass material for custom water areas
local waterSurface = Instance.new("Part")
waterSurface.Size = Vector3.new(50, 0.2, 50)
waterSurface.Position = Vector3.new(0, 0, 0)
waterSurface.Material = Enum.Material.Glass
waterSurface.Color = Color3.fromRGB(0, 100, 180)
waterSurface.Transparency = 0.4
waterSurface.CanCollide = false
waterSurface.Anchored = true
waterSurface.Parent = workspace

-- Animate subtle wave motion
local TweenService = game:GetService("TweenService")
local tweenInfo = TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
TweenService:Create(waterSurface, tweenInfo, {
    Position = waterSurface.Position + Vector3.new(0, 0.3, 0),
}):Play()
\`\`\`

## Swimming Detection
\`\`\`lua
-- Detect when player enters water zone
local waterZone = workspace.WaterZone -- a Part marking the water area
waterZone.Transparency = 1
waterZone.CanCollide = false

waterZone.Touched:Connect(function(hit)
    local humanoid = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
    if humanoid then
        -- Slow down in water
        humanoid.WalkSpeed = 8
    end
end)

waterZone.TouchEnded:Connect(function(hit)
    local humanoid = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
    if humanoid then
        humanoid.WalkSpeed = 16
    end
end)
\`\`\``,
    },

    {
      id: 'pattern:material-surface',
      title: 'MaterialVariant and SurfaceAppearance',
      category: 'pattern',
      tags: ['material', 'materialvariant', 'surfaceappearance', 'texture', 'pbr', 'visual'],
      content: `# MaterialVariant and SurfaceAppearance

## MaterialVariant (Custom Material Overrides)
\`\`\`lua
-- MaterialVariants go in MaterialService
local MaterialService = game:GetService("MaterialService")

local variant = Instance.new("MaterialVariant")
variant.Name = "DarkBrick"
variant.BaseMaterial = Enum.Material.Brick
variant.ColorMap = "rbxassetid://..." -- albedo texture
variant.NormalMap = "rbxassetid://..." -- normal map
variant.RoughnessMap = "rbxassetid://..." -- roughness texture
variant.MetalnessMap = "rbxassetid://..." -- metalness texture
variant.StudsPerTile = 8
variant.Parent = MaterialService

-- Apply to a part
part.Material = Enum.Material.Brick
part.MaterialVariant = "DarkBrick" -- name of the variant
\`\`\`

## SurfaceAppearance (Per-Part PBR)
\`\`\`lua
-- SurfaceAppearance goes inside a MeshPart
local surface = Instance.new("SurfaceAppearance")
surface.ColorMap = "rbxassetid://..."     -- base color / albedo
surface.NormalMap = "rbxassetid://..."    -- normal map for bumps
surface.RoughnessMap = "rbxassetid://..." -- roughness (smooth vs rough)
surface.MetalnessMap = "rbxassetid://..." -- metallic areas
surface.AlphaMode = Enum.AlphaMode.Transparency -- for cutout textures
surface.Parent = meshPart
\`\`\`

## Common Material Uses
\`\`\`lua
-- Neon: Glows, emits light. Great for sci-fi, signs, energy.
part.Material = Enum.Material.Neon
part.Color = Color3.fromRGB(0, 200, 255) -- neon blue glow

-- Glass: Transparent, reflective. Windows, crystals.
part.Material = Enum.Material.Glass
part.Transparency = 0.5

-- ForceField: Animated shield effect. Spawning protection.
part.Material = Enum.Material.ForceField

-- SmoothPlastic: Clean, modern look. Default for UI-style builds.
part.Material = Enum.Material.SmoothPlastic

-- Wood/WoodPlanks: Natural builds, cabins, floors.
part.Material = Enum.Material.WoodPlanks

-- DiamondPlate: Industrial, metal floor grating.
part.Material = Enum.Material.DiamondPlate

-- Concrete: Buildings, sidewalks, industrial.
part.Material = Enum.Material.Concrete
\`\`\`

## Decals and Textures
\`\`\`lua
-- Decal: Image on one face
local decal = Instance.new("Decal")
decal.Texture = "rbxassetid://..."
decal.Face = Enum.NormalId.Front
decal.Parent = part

-- Texture: Repeating image on one face
local tex = Instance.new("Texture")
tex.Texture = "rbxassetid://..."
tex.Face = Enum.NormalId.Top
tex.StudsPerTileU = 4
tex.StudsPerTileV = 4
tex.Parent = part
\`\`\``,
    },
  ];
}
