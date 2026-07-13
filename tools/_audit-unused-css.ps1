$ErrorActionPreference='Stop'
$root='C:/Users/Thric/Desktop/STŮL/Masáže'
Set-Location $root
$css = Get-Content -Raw -Path 'style.css'
$classMatches = [regex]::Matches($css, '(?<![A-Za-z0-9_-])\.([A-Za-z_][A-Za-z0-9_-]*)')
$idMatches = [regex]::Matches($css, '(?<![A-Za-z0-9_-])#([A-Za-z_][A-Za-z0-9_-]*)')
$classes = $classMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$ids = $idMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$files = Get-ChildItem -Recurse -File | Where-Object { $_.Name -ne 'style.css' -and $_.Extension -in '.html','.js','.css','.md' }
$allText = ($files | ForEach-Object { Get-Content -Raw -Path $_.FullName }) -join "`n"
$unusedClasses = @()
foreach($c in $classes){
  $pattern = '(class\s*=\s*"[^"]*\b' + [regex]::Escape($c) + '\b[^"]*")|(classList\.(add|remove|toggle)\(\s*["'']' + [regex]::Escape($c) + '["''])|(["'']' + [regex]::Escape($c) + '["''])'
  if(-not [regex]::IsMatch($allText, $pattern)){ $unusedClasses += $c }
}
$unusedIds = @()
foreach($i in $ids){
  $pattern = '(id\s*=\s*"' + [regex]::Escape($i) + '")|(getElementById\(\s*["'']' + [regex]::Escape($i) + '["''])|(href\s*=\s*"#' + [regex]::Escape($i) + '")'
  if(-not [regex]::IsMatch($allText, $pattern)){ $unusedIds += $i }
}
"TOTAL_CLASSES=$($classes.Count)"
"TOTAL_IDS=$($ids.Count)"
"UNUSED_CLASSES=$($unusedClasses.Count)"
"UNUSED_IDS=$($unusedIds.Count)"
'---UNUSED_CLASSES_SAMPLE---'
$unusedClasses | Select-Object -First 120
'---UNUSED_IDS_SAMPLE---'
$unusedIds | Select-Object -First 120
