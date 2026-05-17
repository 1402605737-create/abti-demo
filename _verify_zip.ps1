$zipPath = "f:\一下\3 AI Product Manger\workspace\5月\5.15\3\abti-demo.zip"
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
foreach ($entry in $zip.Entries) {
    Write-Host $entry.FullName
}
$zip.Dispose()
Write-Host ""
$sizeKB = (Get-Item $zipPath).Length / 1KB
Write-Host "包体大小: $([math]::Round($sizeKB, 2)) KB"
