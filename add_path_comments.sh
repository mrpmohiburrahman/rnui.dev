#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Determine the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

# Change to the script's directory to ensure relative paths are correct
cd "$SCRIPT_DIR"

# Function to add comment to a file
add_comment() {
    local file="$1"
    # Remove the leading ./ from the file path if present
    local rel_path="${file#./}"
    local comment="// ${rel_path}"

    # Check if the first line already contains the comment
    if head -n 1 "$file" | grep -Fxq "$comment"; then
        echo "✔️  Comment already exists in $file. Skipping."
        return
    fi

    # Insert the comment at the top
    tmp_file=$(mktemp)
    echo "$comment" >"$tmp_file"
    cat "$file" >>"$tmp_file"
    mv "$tmp_file" "$file"
    echo "➕ Added comment to $file."
}

export -f add_comment

# Inform the user about the start of the process
echo "🔍 Searching for .ts, .tsx, .js, .jsx files (excluding node_modules) in $SCRIPT_DIR..."

# Count total files for progress reporting
total_files=$(find . -type d -name "node_modules" -prune -o -type f \( -iname "*.ts" -o -iname "*.tsx" -o -iname "*.js" -o -iname "*.jsx" \) -print | wc -l)
echo "🗂️  Total files to process: $total_files"

# Initialize counter
count=0

# Use find with -prune to exclude node_modules directories
find . -type d -name "node_modules" -prune -o -type f \( -iname "*.ts" -o -iname "*.tsx" -o -iname "*.js" -o -iname "*.jsx" \) -print0 |
    while IFS= read -r -d '' file; do
        ((count++))
        echo "Processing ($count/$total_files): $file"
        add_comment "$file"
    done

echo "🎉 Processing complete. Comments have been added to all relevant files."
