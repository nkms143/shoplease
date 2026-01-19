@echo off
echo Starting Local Server for Shop Lease App...
echo.
echo NOTE: Supabase Auth Redirects require a proper URL (http://localhost:8000).
echo Use this script to run the app instead of double-clicking index.html.
echo.
echo Opening App in Browser...
start http://localhost:8000
echo.
echo Server Running. Close this window to stop.
python -m http.server 8000
