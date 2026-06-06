@echo off
REM GP Archive - Automated Weekly Download
REM This batch file is called by Windows Task Scheduler

cd C:\Users\schmi\Downloads\gp_proxy_hosted

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Run the Python script and save output to dated log file
python auto_download_weekly.py > logs\download_%date:~-4,4%%date:~-7,2%%date:~-10,2%.log 2>&1
