import urllib.request, re, json

query = "Ravyn Lenae"
url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
})
html = urllib.request.urlopen(req).read().decode('utf-8', 'ignore')

# Extract all videoIds and titles
matches = re.findall(r'"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\]', html)
print(f"Found {len(matches)} videoRenderer items:")
for v_id, title in matches[:10]:
    print(f" - {v_id}: {title}")
