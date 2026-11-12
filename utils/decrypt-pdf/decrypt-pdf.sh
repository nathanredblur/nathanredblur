#!/usr/bin/env bash
# decrypt-pdf — Remove passwords from PDF files using qpdf
#
# Usage:
#   decrypt-pdf [file.pdf ...] [folder | .]  [--password='PASS' | -p PASS]
#   decrypt-pdf --help

# ─── colors ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── help ────────────────────────────────────────────────────────────────────

show_help() {
  echo -e "${BOLD}decrypt-pdf${RESET} — Remove passwords from PDF files using qpdf"
  echo
  echo -e "${BOLD}USAGE${RESET}"
  echo "  decrypt-pdf [file.pdf ...] [folder | .]  [--password='PASS' | -p PASS]"
  echo "  decrypt-pdf --help"
  echo
  echo -e "${BOLD}ARGUMENTS${RESET}"
  echo "  file.pdf             One or more PDF files to decrypt"
  echo "  folder / .           Directory to search recursively. Defaults to current dir"
  echo "  --password, -p       Password shared across all files"
  echo "  --help, -h           Show this help message"
  echo
  echo -e "${BOLD}EXAMPLES${RESET}"
  echo "  decrypt-pdf my-doc.pdf --password='secret'"
  echo "  decrypt-pdf file1.pdf file2.pdf ../file3.pdf -p='1234'"
  echo "  decrypt-pdf /some/folder --password secret"
  echo "  decrypt-pdf ."
  echo "  decrypt-pdf                    ← uses current dir, prompts for password"
  echo
  echo -e "${BOLD}NOTES${RESET}"
  echo "  - Encrypted original is moved to Trash after successful decryption."
  echo "  - Decrypted file is saved at the original path."
  echo "  - Files with no password or wrong password are skipped and reported."
  echo "  - Same password is used for all files."
}

# ─── check dependencies ──────────────────────────────────────────────────────

if ! command -v qpdf &>/dev/null; then
  echo -e "${RED}Error: qpdf is not installed.${RESET}"
  echo "  macOS : brew install qpdf"
  echo "  Linux : sudo apt install qpdf"
  exit 1
fi

# ─── parse arguments ─────────────────────────────────────────────────────────

declare -a TARGETS=()
PASSWORD=""
PASSWORD_SET=false

args=("$@")
len=${#args[@]}
i=0

while [[ $i -lt $len ]]; do
  arg="${args[$i]}"

  case "$arg" in
    --help|-h)
      show_help
      exit 0
      ;;
    --password=*|-p=*)
      raw="${arg#*=}"
      raw="${raw#\'}"; raw="${raw%\'}"
      raw="${raw#\"}"; raw="${raw%\"}"
      PASSWORD="$raw"
      PASSWORD_SET=true
      ;;
    --password|-p)
      next=$((i + 1))
      if [[ $next -lt $len ]]; then
        i=$next
        raw="${args[$i]}"
        raw="${raw#\'}"; raw="${raw%\'}"
        raw="${raw#\"}"; raw="${raw%\"}"
        PASSWORD="$raw"
        PASSWORD_SET=true
      else
        echo -e "${YELLOW}Warning: '$arg' requires a value.${RESET}"
      fi
      ;;
    -*)
      echo -e "${YELLOW}Unknown option: $arg — ignored.${RESET}"
      ;;
    *)
      TARGETS+=("$arg")
      ;;
  esac

  i=$((i + 1))
done

# Default to current directory if no targets given
[[ ${#TARGETS[@]} -eq 0 ]] && TARGETS=(".")

# ─── collect PDF files ───────────────────────────────────────────────────────

declare -a PDF_FILES=()

# bash 3.2 compatible dedup (no associative arrays)
array_has() {
  local needle="$1"; shift
  local item
  for item in "$@"; do
    [[ "$item" == "$needle" ]] && return 0
  done
  return 1
}

add_pdf() {
  local abs
  abs="$(realpath "$1")"
  if [[ ${#PDF_FILES[@]} -eq 0 ]] || ! array_has "$abs" "${PDF_FILES[@]}"; then
    PDF_FILES+=("$abs")
  fi
}

for target in "${TARGETS[@]}"; do
  if [[ -f "$target" ]]; then
    if [[ "$target" =~ \.[Pp][Dd][Ff]$ ]]; then
      add_pdf "$target"
    else
      echo -e "${YELLOW}Warning: '$target' is not a PDF file — skipped.${RESET}"
    fi
  elif [[ -d "$target" ]]; then
    while IFS= read -r -d '' file; do
      add_pdf "$file"
    done < <(find "$(realpath "$target")" -type f -iname "*.pdf" -print0 | sort -z)
  else
    echo -e "${YELLOW}Warning: '$target' not found — skipped.${RESET}"
  fi
done

if [[ ${#PDF_FILES[@]} -eq 0 ]]; then
  echo "No PDF files found."
  exit 0
fi

# ─── list & confirm if multiple files ────────────────────────────────────────

if [[ ${#PDF_FILES[@]} -gt 1 ]]; then
  echo -e "${BOLD}${CYAN}Found ${#PDF_FILES[@]} PDF file(s):${RESET}"
  for f in "${PDF_FILES[@]}"; do
    echo "  - $f"
  done
  echo
  read -r -p "Proceed to remove password from all listed files? [y/N] " CONFIRM
  [[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { echo "Aborted."; exit 0; }
  echo
fi

# ─── ask for password if not provided ────────────────────────────────────────

if [[ "$PASSWORD_SET" == false ]]; then
  read -r -p "Enter PDF password (press Enter to skip): " PASSWORD
  echo
fi

# ─── trash helper ────────────────────────────────────────────────────────────

trash_file() {
  local file="$1"
  if command -v osascript &>/dev/null; then
    osascript -e "tell application \"Finder\" to delete POSIX file \"$file\"" &>/dev/null
  elif command -v gio &>/dev/null; then
    gio trash "$file"
  else
    echo -e "  ${YELLOW}⚠️  Trash not available — deleting permanently.${RESET}"
    rm -f "$file"
  fi
}

# ─── process files ───────────────────────────────────────────────────────────

declare -a SUCCESS_FILES=()
declare -a WARNING_FILES=()
declare -a NO_PASSWORD_FILES=()
declare -a WRONG_PASSWORD_FILES=()

echo -e "${BOLD}Processing...${RESET}"
echo

for pdf in "${PDF_FILES[@]}"; do
  abs_path="$pdf"
  base="$(basename "$abs_path")"
  dir="$(dirname "$abs_path")"
  tmp_out="${dir}/.decrypt_pdf_tmp_$$_${base}"

  printf "  %-50s " "$base"

  # ── check encryption status (no password needed for this) ────────
  encryption_check=$(qpdf --show-encryption "$abs_path" 2>/dev/null)
  if echo "$encryption_check" | grep -q "File is not encrypted"; then
    echo -e "${YELLOW}⚠️  not encrypted — skipped${RESET}"
    NO_PASSWORD_FILES+=("$abs_path")
    continue
  fi

  # ── attempt decrypt with provided password ───────────────────────
  qpdf_output=$(qpdf --password="$PASSWORD" --decrypt "$abs_path" "$tmp_out" 2>&1)
  exit_code=$?

  case $exit_code in
    0)
      # Clean success
      trash_file "$abs_path"
      mv "$tmp_out" "$abs_path"
      echo -e "${GREEN}✅ decrypted${RESET}"
      SUCCESS_FILES+=("$abs_path")
      ;;
    1)
      # Definite failure (wrong password, corrupt file, etc.)
      rm -f "$tmp_out" 2>/dev/null || true
      if echo "$qpdf_output" | grep -qi "password"; then
        echo -e "${RED}❌ wrong password${RESET}"
      else
        echo -e "${RED}❌ failed${RESET} — $(echo "$qpdf_output" | tail -1)"
      fi
      WRONG_PASSWORD_FILES+=("$abs_path")
      ;;
    *)
      # Exit 2 or 3: qpdf considers these "succeeded with warnings"
      if [[ -f "$tmp_out" ]] && echo "$qpdf_output" | grep -qi "succeeded"; then
        trash_file "$abs_path"
        mv "$tmp_out" "$abs_path"
        echo -e "${GREEN}✅ decrypted ${YELLOW}⚠️  with warnings${RESET}"
        WARNING_FILES+=("$abs_path")
      else
        rm -f "$tmp_out" 2>/dev/null || true
        echo -e "${RED}❌ failed${RESET} — $(echo "$qpdf_output" | tail -1)"
        WRONG_PASSWORD_FILES+=("$abs_path")
      fi
      ;;
  esac
done

# ─── report ──────────────────────────────────────────────────────────────────

echo
echo -e "${BOLD}══════════════════════════════════════${RESET}"
echo -e "${BOLD}           REPORT SUMMARY             ${RESET}"
echo -e "${BOLD}══════════════════════════════════════${RESET}"
echo

echo -e "${GREEN}${BOLD}✅  Decrypted (${#SUCCESS_FILES[@]}):${RESET}"
if [[ ${#SUCCESS_FILES[@]} -eq 0 ]]; then
  echo "    none"
else
  for f in "${SUCCESS_FILES[@]}"; do echo "    - $f"; done
fi

echo
echo -e "${YELLOW}${BOLD}⚠️   Decrypted with warnings (${#WARNING_FILES[@]}):${RESET}"
if [[ ${#WARNING_FILES[@]} -eq 0 ]]; then
  echo "    none"
else
  echo -e "    ${CYAN}The file was decrypted but qpdf reported issues — verify it manually.${RESET}"
  for f in "${WARNING_FILES[@]}"; do echo "    - $f"; done
fi

echo
echo -e "${YELLOW}${BOLD}🔓  Skipped — not encrypted (${#NO_PASSWORD_FILES[@]}):${RESET}"
if [[ ${#NO_PASSWORD_FILES[@]} -eq 0 ]]; then
  echo "    none"
else
  for f in "${NO_PASSWORD_FILES[@]}"; do echo "    - $f"; done
fi

echo
echo -e "${RED}${BOLD}❌  Failed — wrong password (${#WRONG_PASSWORD_FILES[@]}):${RESET}"
if [[ ${#WRONG_PASSWORD_FILES[@]} -eq 0 ]]; then
  echo "    none"
else
  for f in "${WRONG_PASSWORD_FILES[@]}"; do echo "    - $f"; done
fi

echo
