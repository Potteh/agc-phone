local databaseReady = false
local function initializeDatabase()
    local statements = {
        [[CREATE TABLE IF NOT EXISTS `agc_phone_settings` (
            `citizenid` VARCHAR(64) NOT NULL,
            `theme` VARCHAR(16) NOT NULL DEFAULT 'iphone',
            PRIMARY KEY (`citizenid`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci]],
        [[CREATE TABLE IF NOT EXISTS `agc_phone_messages` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `sender` VARCHAR(64) NOT NULL,
            `recipient` VARCHAR(64) NOT NULL,
            `body` VARCHAR(1000) NOT NULL,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_sender` (`sender`),
            KEY `idx_recipient` (`recipient`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci]]
    }
    for i, sql in ipairs(statements) do
        local ok, err = pcall(function() MySQL.query.await(sql) end)
        if not ok then
            print(('[agc-phone] Database installation failed at table %d: %s'):format(i, tostring(err)))
            return
        end
    end
    databaseReady = true
    print('[agc-phone] Database tables verified/installed automatically.')
end
CreateThread(function()
    while GetResourceState('oxmysql') ~= 'started' do Wait(500) end
    initializeDatabase()
end)
local function citizenId(source)
    if Config.Framework == 'qbox' or (Config.Framework == 'auto' and GetResourceState('qbx_core') == 'started') then
        local player = exports.qbx_core:GetPlayer(source)
        return player and player.PlayerData and player.PlayerData.citizenid
    end
    if Config.Framework == 'qbcore' or Config.Framework == 'auto' then
        local core = exports['qb-core']:GetCoreObject()
        local player = core.Functions.GetPlayer(source)
        return player and player.PlayerData and player.PlayerData.citizenid
    end
end
local function validTheme(t) return t == 'iphone' or t == 'samsung' end
RegisterNetEvent('agc-phone:server:load', function()
    if not databaseReady then return end
    local src = source
    local id = citizenId(src)
    if not id then return end
    local row = MySQL.single.await('SELECT theme FROM agc_phone_settings WHERE citizenid = ?', {id})
    local messages = MySQL.query.await('SELECT id, sender, recipient, body, created_at FROM agc_phone_messages WHERE sender = ? OR recipient = ? ORDER BY id DESC LIMIT 100', {id,id})
    TriggerClientEvent('agc-phone:client:load', src, {theme = row and row.theme or Config.DefaultTheme, messages = messages or {}, citizenid = id})
end)
RegisterNetEvent('agc-phone:server:saveTheme', function(theme)
    if not databaseReady then return end
    local id = citizenId(source)
    if not id or not validTheme(theme) then return end
    MySQL.update.await('INSERT INTO agc_phone_settings (citizenid,theme) VALUES (?,?) ON DUPLICATE KEY UPDATE theme = VALUES(theme)', {id,theme})
end)
RegisterNetEvent('agc-phone:server:sendMessage', function(data)
    if not databaseReady then return end
    local src = source
    local id = citizenId(src)
    if not id or type(data) ~= 'table' then return end
    local to = data.recipient
    local body = data.body
    if type(to) ~= 'string' or #to < 1 or #to > 64 or type(body) ~= 'string' or #body < 1 or #body > 1000 then return end
    local msgId = MySQL.insert.await('INSERT INTO agc_phone_messages (sender,recipient,body) VALUES (?,?,?)', {id,to,body})
    local message = {id=msgId,sender=id,recipient=to,body=body}
    TriggerClientEvent('agc-phone:client:message', src, message)
    for _, player in ipairs(GetPlayers()) do
        local target = tonumber(player)
        if target ~= src and citizenId(target) == to then TriggerClientEvent('agc-phone:client:message',target,message) end
    end
end)
