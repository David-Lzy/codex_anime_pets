param([long]$PetHandle, [long]$TestHandle, [int]$OwnerProcessId)
$ErrorActionPreference = 'Stop'
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class PetNativeTest {
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h, int index);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT rect);
    [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT point);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(POINT point);
    [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr h, uint flags);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint x, uint y, uint data, UIntPtr extra);
}
'@
[PetNativeTest]::SetProcessDPIAware() | Out-Null
$pet = [IntPtr]::new($PetHandle)
$test = [IntPtr]::new($TestHandle)
foreach ($handle in @($pet, $test)) {
    [uint32]$owner = 0
    [PetNativeTest]::GetWindowThreadProcessId($handle, [ref]$owner) | Out-Null
    if ($owner -ne $OwnerProcessId) { throw 'Refusing input outside the owned test process' }
}
if (([PetNativeTest]::GetWindowLong($pet, -20) -band 0x20) -eq 0) { throw 'Native WS_EX_TRANSPARENT was not set' }
$rect = [PetNativeTest+RECT]::new()
$cursor = [PetNativeTest+POINT]::new()
if (-not [PetNativeTest]::GetWindowRect($test, [ref]$rect)) { throw 'No test window bounds' }
$point = [PetNativeTest+POINT]::new()
$point.X = [int](($rect.Left + $rect.Right) / 2)
$point.Y = [int](($rect.Top + $rect.Bottom) / 2)
if ([PetNativeTest]::GetAncestor([PetNativeTest]::WindowFromPoint($point), 2) -ne $test) { throw 'Native hit test did not reach the owned test window; no click sent' }
$hasCursor = [PetNativeTest]::GetCursorPos([ref]$cursor)
if (-not $hasCursor -or -not [PetNativeTest]::SetCursorPos($point.X, $point.Y)) {
    '{"style":true,"hitTest":true,"pointerInput":false,"reason":"Input desktop is unavailable"}'
    exit 0
}
try {
    [PetNativeTest]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
    [PetNativeTest]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 150
    if ([PetNativeTest]::GetForegroundWindow() -ne $test) { throw 'Input did not activate the test window' }
    [PetNativeTest]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
    [PetNativeTest]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 150
} finally { [PetNativeTest]::SetCursorPos($cursor.X, $cursor.Y) | Out-Null }
'{"style":true,"hitTest":true,"pointerInput":true}'
