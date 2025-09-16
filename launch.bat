@echo off
cd /d "C:\xampp\htdocs\budget-editor-v1.2.0"
start "" "C:\Program Files\nodejs\node.exe" server.js
start "" "http://localhost/budget-editor-v1.2.0/edit-budget.html"
