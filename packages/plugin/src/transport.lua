local HttpService = game:GetService("HttpService")

local Transport = {}

local DEFAULT_TIMEOUT = 10
local LONG_POLL_TIMEOUT = 20

local function make_request(options)
	local ok, response = pcall(function()
		return HttpService:RequestAsync(options)
	end)
	if not ok then
		return false, tostring(response)
	end
	if response.StatusCode < 200 or response.StatusCode >= 300 then
		local body = response.Body or ""
		return false, "HTTP " .. tostring(response.StatusCode) .. ": " .. body
	end
	local decode_ok, data = pcall(function()
		return HttpService:JSONDecode(response.Body)
	end)
	if not decode_ok then
		return true, response.Body
	end
	return true, data
end

function Transport.register(server_url, token)
	local StudioService = game:GetService("StudioService")
	local place_id = game.PlaceId
	local studio_version = "unknown"
	pcall(function()
		studio_version = StudioService:GetStudioVersion() or "unknown"
	end)

	return make_request({
		Url = server_url .. "/bridge/register",
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
		},
		Body = HttpService:JSONEncode({
			token = token,
			studio_version = studio_version,
			place_id = place_id,
		}),
	})
end

function Transport.poll(server_url, token)
	return make_request({
		Url = server_url .. "/bridge/poll?token=" .. token,
		Method = "GET",
		Headers = {
			["Content-Type"] = "application/json",
		},
	})
end

function Transport.respond(server_url, token, command_id, success, result, error_message)
	return make_request({
		Url = server_url .. "/bridge/respond",
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
		},
		Body = HttpService:JSONEncode({
			token = token,
			command_id = command_id,
			success = success,
			result = result,
			error_message = error_message,
		}),
	})
end

function Transport.heartbeat(server_url, token)
	return make_request({
		Url = server_url .. "/bridge/heartbeat",
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
		},
		Body = HttpService:JSONEncode({
			token = token,
		}),
	})
end

function Transport.long_poll_events(server_url, token)
	local ok, response = pcall(function()
		return HttpService:RequestAsync({
			Url = server_url .. "/bridge/events?token=" .. token,
			Method = "GET",
			Headers = {
				["Content-Type"] = "application/json",
			},
		})
	end)
	if not ok then
		return false, tostring(response)
	end
	if response.StatusCode < 200 or response.StatusCode >= 300 then
		return false, "HTTP " .. tostring(response.StatusCode) .. ": " .. (response.Body or "")
	end
	local decode_ok, data = pcall(function()
		return HttpService:JSONDecode(response.Body)
	end)
	if not decode_ok then
		return true, response.Body
	end
	return true, data
end

return Transport
