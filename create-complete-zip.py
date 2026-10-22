import os
import zipfile
import sys

def make_zip(source_dir, output_zip):
    print(f"Creating zip archive {output_zip} from {source_dir}...")
    
    exclude_dirs = {
        'node_modules', '.git', 'dev-dist', 'dist', '.aistudio', '__pycache__', '.idea', '.gradle'
    }
    exclude_extensions = {'.zip', '.log', '.tmp', '.jks', '.keystore', '.pem', '.key'}
    # Never package secrets: .env files (except the example), signing configs, local SDK paths.
    exclude_names = {'keystore.properties', 'local.properties'}

    total_files = 0
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.git')]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in exclude_extensions or file in exclude_names:
                    continue
                if file.startswith('.env') and file != '.env.example':
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, source_dir)
                
                # Double check to prevent including output zip itself
                if rel_path == os.path.relpath(output_zip, source_dir):
                    continue

                zipf.write(full_path, rel_path)
                total_files += 1

    file_size_mb = os.path.getsize(output_zip) / (1024 * 1024)
    print(f"Successfully created {output_zip} with {total_files} files ({file_size_mb:.2f} MB)")

if __name__ == "__main__":
    source = os.path.abspath(".")
    dest = os.path.abspath("public/grip-complete-project.zip")
    make_zip(source, dest)
