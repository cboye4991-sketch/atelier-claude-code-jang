# E00 - Verification de l'installation sur TON PC Windows
# A lancer dans le terminal de VS Code (PowerShell) :  .\verif-windows.ps1
# Si Windows bloque le script : Set-ExecutionPolicy -Scope Process Bypass  puis relance.

Write-Host "`n== 1. Versions ==" -ForegroundColor Cyan
claude --version
node --version
git --version

Write-Host "`n== 2. Derniere version publiee de Claude Code ==" -ForegroundColor Cyan
npm view @anthropic-ai/claude-code version
Write-Host "Si ta version est inferieure a 2.1.280 : ferme toutes les sessions Claude puis lance"
Write-Host "  npm install -g @anthropic-ai/claude-code@latest"

Write-Host "`n== 3. Cle API (doit afficher 'pas de cle API') ==" -ForegroundColor Cyan
if ($env:ANTHROPIC_API_KEY) { "CLE API PRESENTE - ne la supprime pas seul, demande-moi" } else { "pas de cle API" }

Write-Host "`n== 4. Diagnostic ==" -ForegroundColor Cyan
claude doctor

Write-Host "`n== 5. Dossier de labo ==" -ForegroundColor Cyan
$lab = Join-Path $HOME "claude-lab"
if (-not (Test-Path $lab)) { New-Item -ItemType Directory $lab | Out-Null; "cree : $lab" } else { "existe deja : $lab" }

Write-Host "`nIl reste 3 gestes a faire toi-meme (ils dependent de TON compte) :" -ForegroundColor Yellow
Write-Host "  a) claude auth login   (si doctor dit que tu n'es pas connecte a claude.ai)"
Write-Host "  b) cd `$HOME\claude-lab ; claude   puis tape /status  -> doit afficher Claude Pro"
Write-Host "  c) /usage  -> capture d'ecran, puis /exit"
