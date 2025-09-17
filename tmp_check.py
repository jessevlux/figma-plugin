from pathlib import Path
text = Path("dist/code.js").read_bytes()
print(text[:120])