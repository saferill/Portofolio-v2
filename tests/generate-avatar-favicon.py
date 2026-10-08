import base64
from pathlib import Path

img_bytes = Path('site/images/syafril-avatar-v2.webp').read_bytes()
b64_str = base64.b64encode(img_bytes).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <clipPath id="avatar-clip">
      <circle cx="32" cy="32" r="30" />
    </clipPath>
  </defs>
  <!-- Background circle -->
  <circle cx="32" cy="32" r="31" fill="#171717" />
  <!-- Avatar image -->
  <image href="data:image/webp;base64,{b64_str}" x="2" y="2" width="60" height="60" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice" />
  <!-- Subtle aesthetic border -->
  <circle cx="32" cy="32" r="30" fill="none" stroke="#333333" stroke-width="2" />
  <!-- Status dot accent -->
  <circle cx="50" cy="14" r="5" fill="#171717" />
  <circle cx="50" cy="14" r="3.5" fill="#10b981" />
</svg>
'''

Path('site/favicon.svg').write_text(svg_content, encoding='utf-8')
if Path('public').exists():
    Path('public/favicon.svg').write_text(svg_content, encoding='utf-8')

print("Created site/favicon.svg with Syafril portrait avatar.")
