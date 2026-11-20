"""Export responsive WebP assets from the unchanged source photograph."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
folder = root / 'assets/img/backgrounds'
source = Image.open(folder / 'hero-bg2 (1).png').convert('RGB')
for name, width, target, initial_quality in [
    ('hero-desktop.webp', 3200, 500_000, 84),
    ('hero-mobile.webp', 2000, 250_000, 82),
]:
    height = round(source.height * width / source.width)
    resized = source.resize((width, height), Image.Resampling.LANCZOS)
    quality = initial_quality
    output = folder / name
    while True:
        resized.save(output, 'WEBP', quality=quality, method=6)
        if output.stat().st_size <= target or quality <= 74:
            break
        quality -= 2
    print(f'{name}: {width}x{height}, {output.stat().st_size} bytes, quality {quality}')
