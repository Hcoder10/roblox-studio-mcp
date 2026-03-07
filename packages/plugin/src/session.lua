local HttpService = game:GetService("HttpService")

local Session = {}

local SETTINGS_KEY = "StudioBridgeMCP_SessionToken"

function Session.generate_token()
	return HttpService:GenerateGUID(false)
end

function Session.save_token(plugin_instance, token)
	plugin_instance:SetSetting(SETTINGS_KEY, token)
end

function Session.load_token(plugin_instance)
	local token = plugin_instance:GetSetting(SETTINGS_KEY)
	if token and type(token) == "string" and #token > 0 then
		return token
	end
	return nil
end

function Session.clear_token(plugin_instance)
	plugin_instance:SetSetting(SETTINGS_KEY, nil)
end

return Session
