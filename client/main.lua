local open = false
local function setOpen(state)
    open = state
    SetNuiFocus(state, state)
    SendNUIMessage({action = 'visibility', visible = state})
    if state then TriggerServerEvent('agc-phone:server:load') end
end
RegisterCommand(Config.Command, function() setOpen(not open) end, false)
RegisterKeyMapping(Config.Command, 'Open AGC Phone', 'keyboard', 'F1')
RegisterNUICallback('close', function(_, cb) setOpen(false) cb({ok=true}) end)
RegisterNUICallback('saveTheme', function(data, cb)
    if data.theme ~= 'iphone' and data.theme ~= 'samsung' then cb({ok=false}) return end
    TriggerServerEvent('agc-phone:server:saveTheme', data.theme)
    cb({ok=true})
end)
RegisterNUICallback('sendMessage', function(data, cb)
    TriggerServerEvent('agc-phone:server:sendMessage', data)
    cb({ok=true})
end)
RegisterNetEvent('agc-phone:client:load', function(data)
    SendNUIMessage({action='load', data=data})
end)
RegisterNetEvent('agc-phone:client:message', function(data)
    SendNUIMessage({action='message', data=data})
end)
AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then SetNuiFocus(false, false) end
end)
