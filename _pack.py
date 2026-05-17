import zipfile
import os

base = r"f:\一下\3 AI Product Manger\workspace\5月\5.15\3"
zip_path = os.path.join(base, "abti-demo.zip")

include = [
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "tailwind.config.js",
    "postcss.config.js",
    "eslint.config.js",
    ".gitignore",
    "README.md",
    "b-side-prompt-kit.md",
]

include_dirs = ["src", "public"]

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for f in include:
        fp = os.path.join(base, f)
        if os.path.exists(fp):
            zf.write(fp, f)
            print(f"  + {f}")
    for d in include_dirs:
        for root, dirs, files in os.walk(os.path.join(base, d)):
            for f in files:
                fp = os.path.join(root, f)
                arcname = os.path.relpath(fp, base)
                zf.write(fp, arcname)
                print(f"  + {arcname}")

size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f"\n包体大小: {size_mb:.2f} MB")
print(f"输出文件: {zip_path}")
