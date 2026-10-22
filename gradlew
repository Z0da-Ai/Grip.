#!/bin/sh
set -e
DIRNAME=$(dirname "$0")

# 1. Use system or PATH gradle if present
if command -v gradle >/dev/null 2>&1; then
    exec gradle "$@"
fi

# 2. Resilient fallback: ensure Gradle 8.13 is available and execute
GRADLE_DIR="${HOME}/.gradle-dist/gradle-8.13"
if [ ! -x "${GRADLE_DIR}/bin/gradle" ]; then
    echo "⚙️ Setting up Gradle 8.13 distribution..."
    mkdir -p "${HOME}/.gradle-dist"
    curl -sSL "https://services.gradle.org/distributions/gradle-8.13-bin.zip" -o "${HOME}/.gradle-dist/gradle.zip"
    unzip -q -o "${HOME}/.gradle-dist/gradle.zip" -d "${HOME}/.gradle-dist"
    chmod +x "${GRADLE_DIR}/bin/gradle"
fi

exec "${GRADLE_DIR}/bin/gradle" "$@"
