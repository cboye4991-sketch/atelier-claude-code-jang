#!/bin/bash
# E00 - Verification de l'installation sur TON Mac (equivalent de verif-windows.ps1)
# A lancer dans le Terminal :  bash 00-installation/verif-mac.sh

echo; echo "== 1. Versions =="
claude --version; node --version; git --version

echo; echo "== 2. Derniere version publiee de Claude Code =="
npm view @anthropic-ai/claude-code version 2>/dev/null || echo "(npm absent : normal si Claude Code est installe en natif)"

echo; echo "== 3. Cle API (doit afficher 'pas de cle API') =="
[ -n "$ANTHROPIC_API_KEY" ] && echo "CLE API PRESENTE - ne la supprime pas seul" || echo "pas de cle API"

echo; echo "== 4. Diagnostic =="
claude doctor

echo; echo "== 5. Dossier de labo =="
LAB="$HOME/claude-lab"; [ -d "$LAB" ] && echo "existe deja : $LAB" || { mkdir -p "$LAB"; echo "cree : $LAB"; }
