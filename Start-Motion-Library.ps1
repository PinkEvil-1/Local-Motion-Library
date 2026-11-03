[CmdletBinding()]
param(
    [ValidateRange(1024, 65515)]
    [int]$Port = 4173,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$serverProcess = $null
$previousPort = $env:PORT
$logDirectory = $null
Push-Location -LiteralPath $PSScriptRoot
try {
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $node) { throw 'Node.js is required. Install Node.js 22.12+ or 24, then run this launcher again.' }

    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'dist/index.html'))) {
        $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if (-not $npm) { throw 'npm is required to build the website for the first time.' }
        if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/.bin/vite.cmd'))) {
            Write-Host 'First launch: installing dependencies (internet connection required)...'
            & $npm.Source ci
            if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Check your internet connection and run again.' }
        }
        Write-Host 'Building the local website...'
        & $npm.Source run build
        if ($LASTEXITCODE -ne 0) { throw 'Build failed. See the output above.' }
    }

    $selectedPort = $null
    foreach ($candidate in $Port..($Port + 20)) {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
        try {
            $listener.Start()
            $selectedPort = $candidate
        } catch [System.Net.Sockets.SocketException] {
            # Try the next port without opening an unrelated service.
        } finally {
            $listener.Stop()
        }
        if ($null -ne $selectedPort) { break }
    }
    if ($null -eq $selectedPort) { throw 'No available local port was found. Close another local server or use -Port.' }

    $env:PORT = [string]$selectedPort
    $url = "http://127.0.0.1:$selectedPort/"
    $logDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('motion-library-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $logDirectory | Out-Null
    $serverPath = Join-Path $PSScriptRoot 'serve-local.mjs'
    $serverProcess = Start-Process -FilePath $node.Source -ArgumentList ('"{0}"' -f $serverPath) -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'stdout.log') -RedirectStandardError (Join-Path $logDirectory 'stderr.log')
    $env:PORT = $previousPort

    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        $serverProcess.Refresh()
        if ($serverProcess.HasExited) {
            $detail = Get-Content -LiteralPath (Join-Path $logDirectory 'stderr.log') -Raw -ErrorAction SilentlyContinue
            throw "The local server exited unexpectedly. $detail"
        }
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1
            if ($response.StatusCode -eq 200) { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 250 }
    }
    if (-not $ready) { throw 'The local website did not start in time.' }

    Write-Host ''
    Write-Host "Motion Library is running: $url" -ForegroundColor Green
    if (-not $NoBrowser) { Start-Process -FilePath $url }
    Write-Host 'Keep this window open while using the website.'
    Read-Host 'Press Enter to stop the server and close' | Out-Null
} catch {
    Write-Host ''
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host 'Press Enter to close' | Out-Null
    exit 1
} finally {
    $env:PORT = $previousPort
    if ($null -ne $serverProcess) {
        $serverProcess.Refresh()
        if (-not $serverProcess.HasExited) { Stop-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue }
    }
    Pop-Location
}