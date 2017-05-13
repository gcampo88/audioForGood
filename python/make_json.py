#!/usr/bin/env python

import requests
from collections import defaultdict
from io import BytesIO
import geocoder
import unicodecsv
import json
import feedparser

source_url = "https://docs.google.com/spreadsheets/d/1HLjx6bdLwBpnQ8FSdJpNFtlqjyuZJ-kqxcKDLSqDgC4/pub?gid=0&single=true&output=csv"

# mapper = {
#     'Location':'location',
#     'Name of Podcast':'podcast_name',
#     'Podcast Site URL':'podcast_link',
#     'RSS Feed':'podcast_feed'

# CREATOR = 'Creator(s)/Lead Producer Name';
# EPISODE_NAME = 'Name of Episode';
# RECOMMENDATION = 'Recommendation Notes';
# RECOMMENDER = 'Team Six Assignee'
# }

r = requests.get(source_url,stream=True)
f = BytesIO(r.content)
reader = unicodecsv.DictReader(f, encoding='utf-8')
casts = list(reader)

def getGuid(feed_url,ep_url):
#     print feed_url,ep_url
    feed = feedparser.parse(feed_url)
    entries = feed['entries']
    lookup = {e['enclosures'][0]['href'].split("?")[0]:e['id'] for e in entries if e['enclosures']}
    return lookup[ep_url.split("?")[0]]

for c in casts:
    if c['RSS Feed'] and c['Link to Audiofile'] and 'guid' not in c:
        try:
            c['guid'] = getGuid(c['RSS Feed'],c['Link to Audiofile'])
        except Exception as e:
            print e


by_location = defaultdict(list)
for e in casts:
    if not e['Location']:
        continue
    by_location[e['Location']].append(e)

coords = {l:geocoder.google(l).latlng or geocoder.arcgis(l).latlng for l in by_location}

print [k for k,v in coords.iteritems() if not v]

out = {
    "type": "FeatureCollection",
    "features": [{
           "type": "Feature",
           "properties": {
                "name": l,
                "casts": casts
            },
           "geometry": {
               "type": "Point",
               "coordinates": [
                   coords[l][1],
                   coords[l][0]
               ]
           }
       } for l,casts in by_location.iteritems() if coords[l]]
}

with open("podcasts.json","w") as fh:
    json.dump(out,fh,indent=1)