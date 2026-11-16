local opened=false
local inCall=false
local function incapacitated()
    local ped=PlayerPedId()
    if ped == 0 or IsEntityDead(ped) or IsPedFatallyInjured(ped) then return true end
    local state=LocalPlayer.state
    if state.isDead or state.dead or state.inLaststand or state.laststand then return true end
    local qb=GetResourceState('qb-core')=='started' and exports['qb-core']:GetCoreObject() or nil
    local data=qb and qb.Functions.GetPlayerData() or nil
    if not data and GetResourceState('qbx_core')=='started' then
        local ok,result=pcall(function() return exports.qbx_core:GetPlayerData() end)
        if ok then data=result end
    end
    local meta=data and data.metadata or {}
    return meta.isdead == true or meta.inlaststand == true or meta.isDead == true or meta.inLaststand == true
end
local function toggle(state)
    if state and incapacitated() then return end
    opened=state
    SetNuiFocus(state,state)
    SendNUIMessage({action='visibility',visible=state})
    if state then TriggerServerEvent('agc-phone:server:load') end
end
RegisterCommand(Config.Command,function() toggle(not opened) end,false)
RegisterKeyMapping(Config.Command,'Open AGC Phone','keyboard','F1')
RegisterNUICallback('close',function(_,cb) toggle(false);cb({ok=true}) end)
local actions={saveTheme='saveTheme',savePreferences='savePreferences',saveHomeLayout='saveHomeLayout',sendMessage='sendMessage',saveContact='saveContact',deleteContact='deleteContact',dial='dial',answer='answer',hangup='hangup'}
for name,event in pairs(actions) do
    RegisterNUICallback(name,function(data,cb)
        local payload=data
        if name=='deleteContact' or name=='dial' then payload=data.number end
        if name=='saveTheme' then payload=data.theme end
        if incapacitated() and name~='hangup' then cb({ok=false,error='incapacitated'});return end
        TriggerServerEvent('agc-phone:server:'..event,payload)
        cb({ok=true})
    end)
end
RegisterNetEvent('agc-phone:client:load',function(data) SendNUIMessage({action='load',data=data}) end)
RegisterNetEvent('agc-phone:client:message',function(data) SendNUIMessage({action='message',data=data}) end)
RegisterNetEvent('agc-phone:client:error',function(message) SendNUIMessage({action='error',message=message}) end)
RegisterNetEvent('agc-phone:client:incoming',function(data)
    if incapacitated() then TriggerServerEvent('agc-phone:server:hangup');return end
    SendNUIMessage({action='incoming',data=data})
    if not opened then toggle(true) end
end)
RegisterNetEvent('agc-phone:client:calling',function(data) SendNUIMessage({action='calling',data=data}) end)
RegisterNetEvent('agc-phone:client:connected',function(channel)
    if incapacitated() then TriggerServerEvent('agc-phone:server:hangup');return end
    if GetResourceState('pma-voice')~='started' then
        TriggerServerEvent('agc-phone:server:hangup')
        return
    end
    exports['pma-voice']:setCallChannel(channel)
    inCall=true
    SendNUIMessage({action='connected'})
end)
RegisterNetEvent('agc-phone:client:callEnded',function()
    if inCall and GetResourceState('pma-voice')=='started' then exports['pma-voice']:setCallChannel(0) end
    inCall=false
    SendNUIMessage({action='callEnded'})
    if opened then TriggerServerEvent('agc-phone:server:load') end
end)
AddEventHandler('onResourceStop',function(resource)
    if resource~=GetCurrentResourceName() then return end
    SetNuiFocus(false,false)
    if inCall and GetResourceState('pma-voice')=='started' then exports['pma-voice']:setCallChannel(0) end
end)

CreateThread(function()
    while true do
        Wait(400)
        if incapacitated() then
            if opened then toggle(false) end
            if inCall then TriggerServerEvent('agc-phone:server:hangup') end
        end
    end
end)
