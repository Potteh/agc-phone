fx_version 'cerulean'
game 'gta5'
lua54 'yes'
name 'agc-phone'
author 'AGC'
description 'Dual-theme QBCore/Qbox phone starter'
version '0.6.0'
ui_page 'html/index.html'
files {'html/index.html','html/style.css','html/app.js'}
shared_scripts {'shared/config.lua'}
client_scripts {'client/main.lua'}
server_scripts {'@oxmysql/lib/MySQL.lua','server/main.lua'}
dependency 'oxmysql'
