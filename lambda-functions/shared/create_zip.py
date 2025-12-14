import zipfile
import os
from pathlib import Path

zip_path = Path('../shared-layer.zip')
if zip_path.exists():
    zip_path.unlink()

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    base_path = Path('nodejs')
    for root, dirs, files in os.walk(base_path):
        for file in files:
            file_path = Path(root) / file
            arcname = file_path.relative_to(base_path.parent)
            try:
                zipf.write(file_path, arcname)
            except Exception as e:
                print(f'Warning: Could not add {file_path}: {e}')

size_mb = zip_path.stat().st_size / 1024 / 1024
print(f'ZIP created: {zip_path} ({size_mb:.2f} MB)')
