import urllib.request, re, json

url = "https://www.youtube.com/watch?v=cswfR85D7jM"
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
})
html = urllib.request.urlopen(req).read().decode('utf-8', 'ignore')

# Match videoId and title in watch page
matches = re.findall(r'"compactVideoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"simpleText":"(.*?)"\}', html)
if not matches:
    matches = re.findall(r'"compactVideoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}', html)

print(f"Found {len(matches)} matches")
for v_id, title in matches[:5]:
    print(f"ID: {v_id} | Title: {title}")
