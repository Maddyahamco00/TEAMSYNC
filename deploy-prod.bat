@echo off
echo 🚀 Deploying TeamSync to Production...
echo.

echo 📦 Building and starting production containers...
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak > nul

echo 🔄 Running database migrations...
docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate

echo 🌱 Seeding database with demo data...
docker-compose -f docker-compose.prod.yml exec -T backend npm run db:seed

echo.
echo ✅ Deployment complete!
echo.
echo 🌐 Application URLs:
echo Frontend: http://localhost
echo API: http://localhost/api
echo Backend Direct: http://localhost:5000
echo.
echo 📋 Demo Accounts:
echo Admin: admin@teamsync.com / password123
echo User: john@teamsync.com / password123
echo User: jane@teamsync.com / password123
echo.
echo 🛑 To stop: docker-compose -f docker-compose.prod.yml down
echo 📊 To view logs: docker-compose -f docker-compose.prod.yml logs -f
echo.
pause