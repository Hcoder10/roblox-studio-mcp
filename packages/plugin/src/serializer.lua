local Serializer = {}

local COMMON_PROPERTIES = {
	BasePart = {
		"Position", "Size", "CFrame", "Anchored", "CanCollide", "CanQuery", "CanTouch",
		"Transparency", "Color", "BrickColor", "Material", "Shape", "Locked",
		"Massless", "RootPriority", "CustomPhysicalProperties",
	},
	GuiObject = {
		"Position", "Size", "AnchorPoint", "BackgroundColor3", "BackgroundTransparency",
		"BorderColor3", "BorderSizePixel", "Visible", "ZIndex", "LayoutOrder",
		"AutomaticSize", "ClipsDescendants",
	},
	TextLabel = {
		"Text", "TextColor3", "TextSize", "Font", "TextWrapped",
		"TextXAlignment", "TextYAlignment", "TextScaled", "RichText",
	},
	TextButton = {
		"Text", "TextColor3", "TextSize", "Font", "TextWrapped",
		"TextXAlignment", "TextYAlignment", "TextScaled", "RichText",
	},
	TextBox = {
		"Text", "PlaceholderText", "TextColor3", "TextSize", "Font",
		"TextWrapped", "TextXAlignment", "TextYAlignment", "ClearTextOnFocus",
	},
	ImageLabel = {
		"Image", "ImageColor3", "ImageTransparency", "ScaleType",
		"SliceCenter", "TileSize",
	},
	ImageButton = {
		"Image", "ImageColor3", "ImageTransparency", "ScaleType",
		"SliceCenter", "TileSize",
	},
	Frame = {},
	ScrollingFrame = {
		"CanvasSize", "CanvasPosition", "ScrollBarThickness",
		"ScrollingDirection", "ScrollBarImageColor3",
	},
	UIListLayout = {
		"FillDirection", "HorizontalAlignment", "VerticalAlignment",
		"Padding", "SortOrder",
	},
	UIGridLayout = {
		"CellSize", "CellPadding", "FillDirection",
		"HorizontalAlignment", "VerticalAlignment", "SortOrder",
	},
	UIPadding = {
		"PaddingTop", "PaddingBottom", "PaddingLeft", "PaddingRight",
	},
	UICorner = { "CornerRadius" },
	UIStroke = { "Color", "Thickness", "Transparency", "ApplyStrokeMode" },
	UIAspectRatioConstraint = { "AspectRatio", "AspectType", "DominantAxis" },
	UISizeConstraint = { "MinSize", "MaxSize" },
	Camera = { "CFrame", "FieldOfView", "CameraType", "Focus" },
	Light = { "Color", "Brightness", "Enabled", "Shadows" },
	PointLight = { "Color", "Brightness", "Enabled", "Shadows", "Range" },
	SpotLight = { "Color", "Brightness", "Enabled", "Shadows", "Range", "Angle", "Face" },
	SurfaceLight = { "Color", "Brightness", "Enabled", "Shadows", "Range", "Angle", "Face" },
	Sound = { "SoundId", "Volume", "PlaybackSpeed", "Looped", "Playing" },
	ParticleEmitter = { "Texture", "Rate", "Lifetime", "Speed", "Color", "Size", "Enabled" },
	Model = { "PrimaryPart" },
	Humanoid = { "Health", "MaxHealth", "WalkSpeed", "JumpPower", "JumpHeight" },
	Script = { "Enabled", "RunContext" },
	LocalScript = { "Enabled" },
	ModuleScript = {},
	Attachment = { "CFrame", "Position", "Visible" },
	WeldConstraint = { "Part0", "Part1", "Enabled" },
	Motor6D = { "Part0", "Part1", "C0", "C1" },
	BoolValue = { "Value" },
	IntValue = { "Value" },
	NumberValue = { "Value" },
	StringValue = { "Value" },
	ObjectValue = { "Value" },
	Color3Value = { "Value" },
	Vector3Value = { "Value" },
	CFrameValue = { "Value" },
	BrickColorValue = { "Value" },
}

function Serializer.serialize_value(value)
	local value_type = typeof(value)

	if value_type == "string" or value_type == "number" or value_type == "boolean" then
		return value
	elseif value_type == "nil" then
		return nil
	elseif value_type == "Vector3" then
		return { type = "Vector3", x = value.X, y = value.Y, z = value.Z }
	elseif value_type == "Vector2" then
		return { type = "Vector2", x = value.X, y = value.Y }
	elseif value_type == "CFrame" then
		local components = { value:GetComponents() }
		return {
			type = "CFrame",
			position = { x = components[1], y = components[2], z = components[3] },
			rotation = {
				components[4], components[5], components[6],
				components[7], components[8], components[9],
				components[10], components[11], components[12],
			},
		}
	elseif value_type == "Color3" then
		return { type = "Color3", r = value.R, g = value.G, b = value.B }
	elseif value_type == "BrickColor" then
		return { type = "BrickColor", name = value.Name }
	elseif value_type == "UDim2" then
		return {
			type = "UDim2",
			x = { scale = value.X.Scale, offset = value.X.Offset },
			y = { scale = value.Y.Scale, offset = value.Y.Offset },
		}
	elseif value_type == "UDim" then
		return { type = "UDim", scale = value.Scale, offset = value.Offset }
	elseif value_type == "Rect" then
		return {
			type = "Rect",
			min = { x = value.Min.X, y = value.Min.Y },
			max = { x = value.Max.X, y = value.Max.Y },
		}
	elseif value_type == "Enum" then
		return { type = "Enum", enum_type = tostring(value.EnumType), name = value.Name, value = value.Value }
	elseif value_type == "EnumItem" then
		return { type = "EnumItem", enum_type = tostring(value.EnumType), name = value.Name, value = value.Value }
	elseif value_type == "NumberSequence" then
		local keypoints = {}
		for _, kp in ipairs(value.Keypoints) do
			table.insert(keypoints, { time = kp.Time, value = kp.Value, envelope = kp.Envelope })
		end
		return { type = "NumberSequence", keypoints = keypoints }
	elseif value_type == "ColorSequence" then
		local keypoints = {}
		for _, kp in ipairs(value.Keypoints) do
			table.insert(keypoints, { time = kp.Time, color = { r = kp.Value.R, g = kp.Value.G, b = kp.Value.B } })
		end
		return { type = "ColorSequence", keypoints = keypoints }
	elseif value_type == "NumberRange" then
		return { type = "NumberRange", min = value.Min, max = value.Max }
	elseif value_type == "PhysicalProperties" then
		return {
			type = "PhysicalProperties",
			density = value.Density,
			friction = value.Friction,
			elasticity = value.Elasticity,
			frictionWeight = value.FrictionWeight,
			elasticityWeight = value.ElasticityWeight,
		}
	elseif value_type == "Instance" then
		return { type = "Instance", className = value.ClassName, name = value.Name, path = value:GetFullName() }
	elseif value_type == "Ray" then
		return {
			type = "Ray",
			origin = { x = value.Origin.X, y = value.Origin.Y, z = value.Origin.Z },
			direction = { x = value.Direction.X, y = value.Direction.Y, z = value.Direction.Z },
		}
	elseif value_type == "Font" then
		return { type = "Font", family = value.Family, weight = value.Weight.Name, style = value.Style.Name }
	else
		return { type = value_type, value = tostring(value) }
	end
end

function Serializer.deserialize_value(data)
	if type(data) ~= "table" then
		return data
	end

	local t = data.type
	if not t then
		return data
	end

	if t == "Vector3" then
		return Vector3.new(data.x or 0, data.y or 0, data.z or 0)
	elseif t == "Vector2" then
		return Vector2.new(data.x or 0, data.y or 0)
	elseif t == "CFrame" then
		if data.position and data.rotation then
			local p = data.position
			local r = data.rotation
			return CFrame.new(
				p.x, p.y, p.z,
				r[1], r[2], r[3],
				r[4], r[5], r[6],
				r[7], r[8], r[9]
			)
		elseif data.position then
			return CFrame.new(data.position.x, data.position.y, data.position.z)
		end
		return CFrame.new()
	elseif t == "Color3" then
		return Color3.new(data.r or 0, data.g or 0, data.b or 0)
	elseif t == "BrickColor" then
		return BrickColor.new(data.name or "Medium stone grey")
	elseif t == "UDim2" then
		local x = data.x or { scale = 0, offset = 0 }
		local y = data.y or { scale = 0, offset = 0 }
		return UDim2.new(x.scale or 0, x.offset or 0, y.scale or 0, y.offset or 0)
	elseif t == "UDim" then
		return UDim.new(data.scale or 0, data.offset or 0)
	elseif t == "Rect" then
		local mn = data.min or { x = 0, y = 0 }
		local mx = data.max or { x = 0, y = 0 }
		return Rect.new(mn.x, mn.y, mx.x, mx.y)
	elseif t == "EnumItem" and data.enum_type and data.name then
		local ok, result = pcall(function()
			return Enum[data.enum_type][data.name]
		end)
		if ok then
			return result
		end
		return nil
	elseif t == "NumberSequence" and data.keypoints then
		local keypoints = {}
		for _, kp in ipairs(data.keypoints) do
			table.insert(keypoints, NumberSequenceKeypoint.new(kp.time, kp.value, kp.envelope or 0))
		end
		return NumberSequence.new(keypoints)
	elseif t == "ColorSequence" and data.keypoints then
		local keypoints = {}
		for _, kp in ipairs(data.keypoints) do
			table.insert(keypoints, ColorSequenceKeypoint.new(kp.time, Color3.new(kp.color.r, kp.color.g, kp.color.b)))
		end
		return ColorSequence.new(keypoints)
	elseif t == "NumberRange" then
		return NumberRange.new(data.min or 0, data.max or 0)
	elseif t == "PhysicalProperties" then
		return PhysicalProperties.new(
			data.density or 1, data.friction or 0.3, data.elasticity or 0.5,
			data.frictionWeight or 1, data.elasticityWeight or 1
		)
	elseif t == "Font" then
		local weight = Enum.FontWeight.Regular
		local style = Enum.FontStyle.Normal
		pcall(function()
			if data.weight then weight = Enum.FontWeight[data.weight] end
			if data.style then style = Enum.FontStyle[data.style] end
		end)
		return Font.new(data.family or "rbxasset://fonts/families/SourceSansPro.json", weight, style)
	end

	return data
end

function Serializer.get_properties_for_class(className)
	local props = {}
	for class, class_props in pairs(COMMON_PROPERTIES) do
		if className == class then
			for _, prop in ipairs(class_props) do
				table.insert(props, prop)
			end
		end
	end

	-- Check inheritance by trying to read BasePart properties
	if #props == 0 then
		-- Fallback: try common base classes
		local base_classes = { "BasePart", "GuiObject" }
		for _, base in ipairs(base_classes) do
			local base_props = COMMON_PROPERTIES[base]
			if base_props then
				for _, prop in ipairs(base_props) do
					table.insert(props, prop)
				end
			end
		end
	end

	return props
end

function Serializer.instance_to_json(instance, depth)
	depth = depth or 1

	local result = {
		className = instance.ClassName,
		name = instance.Name,
		fullName = instance:GetFullName(),
		properties = {},
	}

	-- Get known properties for this class
	local prop_names = Serializer.get_properties_for_class(instance.ClassName)

	-- Always try Name, Parent
	for _, prop_name in ipairs(prop_names) do
		local ok, value = pcall(function()
			return (instance :: any)[prop_name]
		end)
		if ok and value ~= nil then
			result.properties[prop_name] = Serializer.serialize_value(value)
		end
	end

	-- Special: if it's a script, include Source
	if instance:IsA("LuaSourceContainer") then
		local ok, source = pcall(function()
			return instance.Source
		end)
		if ok then
			result.properties.Source = source
		end
	end

	-- Children
	if depth > 0 then
		local children = {}
		for _, child in ipairs(instance:GetChildren()) do
			table.insert(children, Serializer.instance_to_json(child, depth - 1))
		end
		if #children > 0 then
			result.children = children
		end
	end

	return result
end

function Serializer.json_to_properties(json_props)
	local result = {}
	for key, value in pairs(json_props) do
		result[key] = Serializer.deserialize_value(value)
	end
	return result
end

return Serializer
