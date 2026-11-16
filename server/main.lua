local ready = false
local calls, active = {}, {}
local nextCall = 0
local function cid(src)
    if Config.Framework == 'qbox' or (Config.Framework == 'auto' and GetResourceState('qbx_core') == 'started') then
        local p = exports.qbx_core:GetPlayer(src)
        return p and p.PlayerData and p.PlayerData.citizenid
    end
    if GetResourceState('qb-core') == 'started' then
        local p = exports['qb-core']:GetCoreObject().Functions.GetPlayer(src)
        return p and p.PlayerData and p.PlayerData.citizenid
    end
end
local function down(src)
    local player
    if Config.Framework == 'qbox' or (Config.Framework == 'auto' and GetResourceState('qbx_core') == 'started') then
        player = exports.qbx_core:GetPlayer(src)
    elseif GetResourceState('qb-core') == 'started' then
        player = exports['qb-core']:GetCoreObject().Functions.GetPlayer(src)
    end
    local m = player and player.PlayerData and player.PlayerData.metadata or {}
    local state = Player(src).state
    return m.isdead == true or m.inlaststand == true or m.isDead == true or m.inLaststand == true
        or state.isDead == true or state.dead == true or state.inLaststand == true or state.laststand == true
end
local function online(id)
    for _, p in ipairs(GetPlayers()) do
        local src = tonumber(p)
        if cid(src) == id then return src end
    end
end
local function validNumber(n) return type(n) == 'string' and n:match('^%d%d%d%d%d%d%d%d%d%d$') ~= nil end
local function numberFor(id)
    local row = MySQL.single.await('SELECT number FROM agc_phone_numbers WHERE citizenid = ?', {id})
    if row then return row.number end
    for _ = 1, 30 do
        local n = tostring(math.random(200, 989)) .. tostring(math.random(100,999)) .. tostring(math.random(1000,9999))
        local ok, inserted = pcall(function()
            return MySQL.insert.await('INSERT INTO agc_phone_numbers (citizenid,number) VALUES (?,?)', {id,n})
        end)
        if ok and inserted then return n end
        row = MySQL.single.await('SELECT number FROM agc_phone_numbers WHERE citizenid = ?', {id})
        if row then return row.number end
    end
    print('[agc-phone] Could not assign number to ' .. id)
end
CreateThread(function()
    while GetResourceState('oxmysql') ~= 'started' do Wait(500) end
    local schema = {
        [[CREATE TABLE IF NOT EXISTS agc_phone_settings (citizenid VARCHAR(64) PRIMARY KEY, theme VARCHAR(16) NOT NULL DEFAULT 'iphone') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]],
        [[CREATE TABLE IF NOT EXISTS agc_phone_preferences (citizenid VARCHAR(64) PRIMARY KEY, wallpaper VARCHAR(24) NOT NULL DEFAULT 'aurora', brightness TINYINT UNSIGNED NOT NULL DEFAULT 85, dark_mode TINYINT(1) NOT NULL DEFAULT 1, sounds TINYINT(1) NOT NULL DEFAULT 1, lock_enabled TINYINT(1) NOT NULL DEFAULT 1) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]],
        [[CREATE TABLE IF NOT EXISTS agc_phone_numbers (citizenid VARCHAR(64) PRIMARY KEY, number VARCHAR(10) NOT NULL UNIQUE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]],
        [[CREATE TABLE IF NOT EXISTS agc_phone_contacts (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, citizenid VARCHAR(64) NOT NULL, name VARCHAR(80) NOT NULL, number VARCHAR(10) NOT NULL, UNIQUE KEY owner_number(citizenid,number)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]],
        [[CREATE TABLE IF NOT EXISTS agc_phone_messages (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, sender VARCHAR(64) NOT NULL, recipient VARCHAR(64) NOT NULL, body VARCHAR(1000) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, KEY idx_sender(sender), KEY idx_recipient(recipient)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]],
        [[CREATE TABLE IF NOT EXISTS agc_phone_call_history (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, caller VARCHAR(64) NOT NULL, callee VARCHAR(64) NOT NULL, status VARCHAR(20) NOT NULL, started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, KEY idx_caller(caller), KEY idx_callee(callee)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]]
    }
    for i, sql in ipairs(schema) do
        local ok, err = pcall(function() MySQL.query.await(sql) end)
        if not ok then print(('[agc-phone] SQL setup failed at %d: %s'):format(i,err)); return end
    end
    local column = MySQL.scalar.await([[SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agc_phone_contacts' AND COLUMN_NAME = 'photo']])
    if tonumber(column) == 0 then
        local ok, err = pcall(function() MySQL.query.await('ALTER TABLE agc_phone_contacts ADD COLUMN photo VARCHAR(500) NULL') end)
        if not ok then print('[agc-phone] Photo migration failed: ' .. tostring(err)); return end
    end
    local layoutColumn = MySQL.scalar.await([[SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agc_phone_preferences' AND COLUMN_NAME = 'home_layout']])
    if tonumber(layoutColumn) == 0 then
        local ok, err = pcall(function() MySQL.query.await('ALTER TABLE agc_phone_preferences ADD COLUMN home_layout VARCHAR(255) NULL') end)
        if not ok then print('[agc-phone] Home layout migration failed: ' .. tostring(err)); return end
    end
    ready = true
    print('[agc-phone] Database tables verified/installed automatically.')
end)
local function load(src)
    if not ready or down(src) then return end
    local id = cid(src)
    if not id then return end
    local num = numberFor(id)
    local theme = MySQL.scalar.await('SELECT theme FROM agc_phone_settings WHERE citizenid=?',{id}) or 'iphone'
    local preferences = MySQL.single.await('SELECT wallpaper,brightness,dark_mode,sounds,lock_enabled,home_layout FROM agc_phone_preferences WHERE citizenid=?',{id}) or {wallpaper='aurora',brightness=85,dark_mode=1,sounds=1,lock_enabled=1}
    local contacts = MySQL.query.await('SELECT id,name,number,photo FROM agc_phone_contacts WHERE citizenid=? ORDER BY name',{id})
    local messages = MySQL.query.await('SELECT id,sender,recipient,body,created_at FROM agc_phone_messages WHERE sender=? OR recipient=? ORDER BY id DESC LIMIT 100',{id,id})
    local history = MySQL.query.await('SELECT id,caller,callee,status,started_at FROM agc_phone_call_history WHERE caller=? OR callee=? ORDER BY id DESC LIMIT 30',{id,id})
    TriggerClientEvent('agc-phone:client:load',src,{citizenid=id,number=num,theme=theme,preferences=preferences,contacts=contacts,messages=messages,history=history})
end
RegisterNetEvent('agc-phone:server:load',function() load(source) end)
RegisterNetEvent('agc-phone:server:saveTheme',function(theme)
    local id=cid(source)
    if not ready or down(source) or not id or (theme~='iphone' and theme~='samsung') then return end
    MySQL.update.await('INSERT INTO agc_phone_settings (citizenid,theme) VALUES (?,?) ON DUPLICATE KEY UPDATE theme=VALUES(theme)',{id,theme})
end)
RegisterNetEvent('agc-phone:server:savePreferences',function(data)
    local src=source
    local id=cid(src)
    if not ready or not id or down(src) or type(data)~='table' then return end
    local wallpapers={aurora=true,ocean=true,sunset=true,midnight=true}
    if not wallpapers[data.wallpaper] then return end
    local brightness=tonumber(data.brightness)
    if not brightness or brightness~=math.floor(brightness) or brightness<35 or brightness>100 then return end
    local function bool(v) return v==true or v==false end
    if not bool(data.darkMode) or not bool(data.sounds) or not bool(data.lockEnabled) then return end
    MySQL.update.await([[INSERT INTO agc_phone_preferences (citizenid,wallpaper,brightness,dark_mode,sounds,lock_enabled)
        VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE wallpaper=VALUES(wallpaper),brightness=VALUES(brightness),
        dark_mode=VALUES(dark_mode),sounds=VALUES(sounds),lock_enabled=VALUES(lock_enabled)]],
        {id,data.wallpaper,brightness,data.darkMode and 1 or 0,data.sounds and 1 or 0,data.lockEnabled and 1 or 0})
end)
RegisterNetEvent('agc-phone:server:saveHomeLayout',function(layout)
    local src=source
    local id=cid(src)
    if not ready or not id or down(src) or type(layout)~='table' or #layout~=4 then return end
    local allowed={dialer=true,messages=true,contacts=true,settings=true}
    local seen={}
    for _,app in ipairs(layout) do
        if type(app)~='string' or not allowed[app] or seen[app] then return end
        seen[app]=true
    end
    local encoded=table.concat(layout,',')
    MySQL.update.await('INSERT INTO agc_phone_preferences (citizenid,home_layout) VALUES (?,?) ON DUPLICATE KEY UPDATE home_layout=VALUES(home_layout)',{id,encoded})
end)
RegisterNetEvent('agc-phone:server:saveContact',function(data)
    local src=source; local id=cid(src)
    if not ready or down(src) or not id or type(data)~='table' or not validNumber(data.number) or type(data.name)~='string' or #data.name<1 or #data.name>80 then return end
    local photo = data.photo
    if photo == '' then photo = nil end
    if photo ~= nil and (type(photo) ~= 'string' or #photo > 500 or not photo:match('^https://[%w%.%-]+/?.*$')) then return end
    MySQL.update.await('INSERT INTO agc_phone_contacts (citizenid,name,number,photo) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),photo=VALUES(photo)',{id,data.name,data.number,photo})
    load(src)
end)
RegisterNetEvent('agc-phone:server:deleteContact',function(number)
    local src=source;local id=cid(src)
    if not ready or down(src) or not id or not validNumber(number) then return end
    MySQL.update.await('DELETE FROM agc_phone_contacts WHERE citizenid=? AND number=?',{id,number})
    load(src)
end)
RegisterNetEvent('agc-phone:server:sendMessage',function(data)
    local src=source;local id=cid(src)
    if not ready or down(src) or not id or type(data)~='table' or not validNumber(data.recipient) or type(data.body)~='string' or #data.body<1 or #data.body>1000 then return end
    local recipient=MySQL.scalar.await('SELECT citizenid FROM agc_phone_numbers WHERE number=?',{data.recipient})
    if not recipient then TriggerClientEvent('agc-phone:client:error',src,'Phone number not found');return end
    local mid=MySQL.insert.await('INSERT INTO agc_phone_messages (sender,recipient,body) VALUES (?,?,?)',{id,recipient,data.body})
    local msg={id=mid,sender=id,recipient=recipient,body=data.body}
    TriggerClientEvent('agc-phone:client:message',src,msg)
    local target=online(recipient)
    if target and target~=src then TriggerClientEvent('agc-phone:client:message',target,msg) end
end)
local function finish(callId,status)
    local call=calls[callId];if not call then return end
    calls[callId]=nil;active[call.a]=nil;active[call.b]=nil
    MySQL.insert.await('INSERT INTO agc_phone_call_history (caller,callee,status) VALUES (?,?,?)',{call.aid,call.bid,status})
    for _,src in ipairs({call.a,call.b}) do
        if GetPlayerName(src) then TriggerClientEvent('agc-phone:client:callEnded',src) end
    end
end
RegisterNetEvent('agc-phone:server:dial',function(number)
    local src=source;local id=cid(src)
    if not ready or down(src) or not id or not validNumber(number) or active[src] then return end
    local to=MySQL.scalar.await('SELECT citizenid FROM agc_phone_numbers WHERE number=?',{number})
    if not to or to==id then TriggerClientEvent('agc-phone:client:error',src,'Number unavailable');return end
    local dst=online(to)
    if not dst or active[dst] or down(dst) then TriggerClientEvent('agc-phone:client:error',src,'Line unavailable');return end
    nextCall=nextCall+1
    local callId=nextCall
    calls[callId]={a=src,b=dst,aid=id,bid=to,accepted=false}
    active[src]=callId;active[dst]=callId
    TriggerClientEvent('agc-phone:client:calling',src,{number=number})
    TriggerClientEvent('agc-phone:client:incoming',dst,{number=numberFor(id)})
    SetTimeout(30000,function()
        local c=calls[callId]
        if c and not c.accepted then finish(callId,'missed') end
    end)
end)
RegisterNetEvent('agc-phone:server:answer',function()
    local src=source;local callId=active[src];local c=callId and calls[callId]
    if not c or c.b~=src or c.accepted then return end
    if down(src) or down(c.a) then finish(callId,'unavailable');return end
    c.accepted=true
    local channel=100000+callId
    TriggerClientEvent('agc-phone:client:connected',c.a,channel)
    TriggerClientEvent('agc-phone:client:connected',c.b,channel)
end)
RegisterNetEvent('agc-phone:server:hangup',function()
    local src=source;local callId=active[src];local c=callId and calls[callId]
    if c then finish(callId,c.accepted and 'completed' or 'declined') end
end)
AddEventHandler('playerDropped',function()
    local callId=active[source];local c=callId and calls[callId]
    if c then finish(callId,'disconnected') end
end)
