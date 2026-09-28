#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: scripts/integration-check.sh [--help] [--dry-run]

Validate submodules, Compose configuration, and child repository cleanliness.
EOF
}

main() {
    local dry_run=false
    while (($# > 0)); do
        case "$1" in
            --help) usage; return 0 ;;
            --dry-run) dry_run=true ;;
            *) printf 'unknown argument: %s\n' "$1" >&2; usage >&2; return 2 ;;
        esac
        shift
    done
    local commands=(
        "git submodule sync --recursive"
        "git submodule update --init --recursive"
        "git diff --check"
        "docker compose config"
    )
    printf '   %s\n' "${commands[@]}"
    if [[ "$dry_run" == false ]]; then
        git submodule sync --recursive
        git submodule update --init --recursive
        git diff --check
        docker compose config >/dev/null
    fi
}

main "$@"
