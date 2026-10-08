import urllib.request, re, json

url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote("Ravyn Lenae songs")
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
})
html = urllib.request.urlopen(req).read().decode('utf-8', 'ignore')

tracks = []
seen = set(["cswfR85D7jM"])
blocks = html.split('"videoRenderer":{')[1:]
for block in blocks:
    id_m = re.search(r'"videoId":"([a-zA-Z0-9_-]{11})"', block)
    title_m = re.search(r'"title":\{"runs":\[\{"text":"([^"]+)"\}\]', block)
    if not id_m or not title_m:
        continue
    v_id = id_m.group(1)
    if v_id in seen:
        continue
    seen.add(v_id)
    raw_title = title_m.group(1).replace(r'\u0026', '&')
    
    artist_name = "YouTube"
    byline_m = re.search(r'"(?:longBylineText|ownerText)":\{"runs":\[\{"text":"([^"]+)"\}\]', block)
    if byline_m:
        artist_name = byline_m.group(1).replace(r'\u0026', '&')
    
    clean_title = raw_title
    if " - " in raw_title:
        parts = raw_title.split(" - ")
        artist_name = parts[0].strip()
        clean_title = " - ".join(parts[1:]).strip()
    clean_title = re.sub(r'\(Official.*|\(Lyrics.*|\[Official.*|\[Lyrics.*', '', clean_title, flags=re.I).strip()
    
    len_m = re.search(r'"lengthText":\{"simpleText":"(\d+:\d+)"\}', block)
    dur_str = len_m.group(1) if len_m else "3:30"
    
    tracks.append({
        'id': v_id,
        'title': clean_title,
        'artist': artist_name,
        'duration': dur_str
    })
    if len(tracks) >= 5:
        break

print(json.dumps(tracks, indent=2))
