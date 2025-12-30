import os

# ==========================
# AUTO PROJECT ROOT
# ==========================

PROJECT_ROOT = os.getcwd()   # <-- current directory
OUTPUT_FILE = "flattened_backend.py"

INCLUDE_FOLDERS = [
    "app",
    "api",
    "scripts"
]

EXCLUDE_FILES = {
    "__init__.py"
}

# ==========================
# FLATTENER LOGIC
# ==========================

def collect_python_files():
    python_files = []

    for folder in INCLUDE_FOLDERS:
        folder_path = os.path.join(PROJECT_ROOT, folder)

        if not os.path.isdir(folder_path):
            print(f"⚠️ Skipping missing folder: {folder_path}")
            continue

        for root, _, files in os.walk(folder_path):
            for file in files:
                if file.endswith(".py") and file not in EXCLUDE_FILES:
                    python_files.append(os.path.join(root, file))

    return sorted(python_files)


def flatten():
    files = collect_python_files()

    if not files:
        print("❌ No Python files found. Check folder names.")
        return

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write("# =====================================================\n")
        out.write("# AUTO-GENERATED FLATTENED BACKEND FILE\n")
        out.write("# SOURCE: trade-document-processor\n")
        out.write("# =====================================================\n\n")

        for file_path in files:
            relative_path = os.path.relpath(file_path, PROJECT_ROOT)

            out.write("\n\n")
            out.write("# =====================================================\n")
            out.write(f"# FILE: {relative_path}\n")
            out.write("# =====================================================\n\n")

            with open(file_path, "r", encoding="utf-8") as f:
                out.write(f.read())
                out.write("\n")

    print(f"✅ Flattened backend written to: {OUTPUT_FILE}")
    print(f"📄 Total files merged: {len(files)}")


if __name__ == "__main__":
    flatten()
