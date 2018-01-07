@echo off
taskkill /F /IM chrome.exe /T
set mypath="%cd%/index.html"
@echo %mypath%
start /max chrome.exe --allow-file-access-from-files %mypath% –disk-cache-size=10000000
exit