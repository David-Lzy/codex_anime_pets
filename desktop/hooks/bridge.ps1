param([string]$EndpointFile, [switch]$Assistant004Hook)
$ErrorActionPreference = 'Stop'
try {
    $At = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $Buffer = New-Object char[] 16384
    $Builder = New-Object System.Text.StringBuilder
    while (($Count = [Console]::In.Read($Buffer, 0, $Buffer.Length)) -gt 0) {
        if ($Builder.Length + $Count -gt 8388608) { exit 0 }
        [void]$Builder.Append($Buffer, 0, $Count)
    }
    $Raw = $Builder.ToString()
    $InputEvent = $Raw | ConvertFrom-Json
    $Endpoint = [System.IO.File]::ReadAllText($EndpointFile) | ConvertFrom-Json
    if ($Endpoint.port -lt 1 -or $Endpoint.port -gt 65535 -or $Endpoint.token -notmatch '^[a-f0-9]{64}$') { exit 0 }
    $Result = $InputEvent.tool_response
    if ($Result -is [string]) { try { $Result = $Result | ConvertFrom-Json } catch { $Result = $null } }
    $Failed = ($Result.isError -eq $true) -or ($Result.is_error -eq $true)
    if (($Result.exit_code -is [int] -or $Result.exit_code -is [long]) -and $Result.exit_code -ne 0) { $Failed = $true }
    $Tool = [string]$InputEvent.tool_name
    $Workspace = ([string]$InputEvent.cwd -replace '\\', '/').TrimEnd('/').Split('/')[-1]
    $Body = @{
        event = $InputEvent.hook_event_name; sessionId = $InputEvent.session_id
        turnId = [string]$InputEvent.turn_id; tool = $Tool.Substring(0, [Math]::Min(180, $Tool.Length))
        callId = [string]$InputEvent.tool_use_id
        failed = [bool]$Failed; at = $At; workspace = $Workspace.Substring(0, [Math]::Min(100, $Workspace.Length))
    } | ConvertTo-Json -Compress
    $Request = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:$($Endpoint.port)/events")
    $Request.Proxy = $null
    $Request.Method = 'POST'
    $Request.Timeout = 750
    $Request.ReadWriteTimeout = 750
    $Request.ContentType = 'application/json'
    $Request.Headers['Authorization'] = "Bearer $($Endpoint.token)"
    $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $Request.ContentLength = $Bytes.Length
    $Stream = $Request.GetRequestStream()
    $Stream.Write($Bytes, 0, $Bytes.Length)
    $Stream.Close()
    $Response = $Request.GetResponse()
    $Response.Close()
} catch {}
exit 0
