# API Endpoint Testing Script
# Run this script to test all your API endpoints

Write-Host "🚀 Testing API Endpoints on http://localhost:5002" -ForegroundColor Green
Write-Host "=" * 50

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5002/health" -Method GET
    Write-Host "✅ Health Check: $($health.status) - Port: $($health.port)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Jobs API
Write-Host "`n2. Testing Jobs API..." -ForegroundColor Yellow
try {
    $jobs = Invoke-RestMethod -Uri "http://localhost:5002/api/jobs" -Method GET
    Write-Host "✅ Jobs API: Success - Found $($jobs.data.Count) jobs" -ForegroundColor Green
} catch {
    Write-Host "❌ Jobs API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Auth Register (Test)
Write-Host "`n3. Testing Auth Register..." -ForegroundColor Yellow
$testUser = @{
    name = "Test User $(Get-Random)"
    email = "test$(Get-Random)@example.com"
    password = "password123"
    role = "student"
    department = "computer-science"
    semester = "5"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "http://localhost:5002/api/auth/register" -Method POST -Body $testUser -ContentType "application/json"
    Write-Host "✅ Auth Register: Success - User ID: $($register.user.id)" -ForegroundColor Green
    $testToken = $register.token
} catch {
    Write-Host "❌ Auth Register Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Students Profile (if token exists)
if ($testToken) {
    Write-Host "`n4. Testing Students Profile..." -ForegroundColor Yellow
    try {
        $headers = @{ "Authorization" = "Bearer $testToken" }
        $profile = Invoke-RestMethod -Uri "http://localhost:5002/api/students/profile" -Method GET -Headers $headers
        Write-Host "✅ Students Profile: Success - Profile completion: $($profile.data.profileCompletion)%" -ForegroundColor Green
    } catch {
        Write-Host "❌ Students Profile Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "Your backend is running on: http://localhost:5002" -ForegroundColor Cyan
Write-Host "Your frontend is running on: http://localhost:5174" -ForegroundColor Cyan
