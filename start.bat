@echo off
echo ========================================
echo   DAO Contrib Agent - 启动脚本
echo ========================================
echo.

echo [1/3] 安装前端依赖...
cd frontend
call npm install
if errorlevel 1 (
    echo 前端依赖安装失败!
    pause
    exit /b 1
)
cd ..

echo.
echo [2/3] 安装后端依赖...
cd backend
call npm install
if errorlevel 1 (
    echo 后端依赖安装失败!
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] 启动服务...
echo.
echo 后端服务启动中... (端口 3001)
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo 前端服务启动中... (端口 5173)
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   启动完成!
echo   前端: http://localhost:5173
echo   后端: http://localhost:3001
echo ========================================
echo.
pause
