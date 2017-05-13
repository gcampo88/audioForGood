$(document).ready(function () {
  LOCATION = 'Location';
  PODCAST_NAME = 'Name of Podcast';
  PODCAST_LINK =  'Podcast Site URL';
  PODCAST_FEED = 'RSS Feed';
  CREATOR = 'Creator(s)/Lead Producer Name';
  EPISODE_NAME = 'Name of Episode';
  EPISODE_GUID = 'guid';
  RECOMMENDATION = 'Recommendation Notes';
  DEFAULT_RECOMMENDATION = 'Great episode!'
  RECOMMENDER = 'Team Six Assignee';
  DEFAULT_RECOMMENDER = 'Team Six'
  PLAYER_URL = "https://play.prx.org/e?";

  mapboxgl.accessToken = 'pk.eyJ1IjoibWNsYXVnaGxpbiIsImEiOiJjajBwZmpnbDkwMHQxMzNud2ZtandkbGN5In0.pa7_xZbE3ZDF-cfFedFHjw';

  var map = new mapboxgl.Map({
    container: 'map',
    center: [-95, 38],
    zoom: 1,
    style: 'mapbox://styles/mapbox/light-v9'
  });

  function reverseGeocode(lat,lng) {
    return new Promise(function(resolve,reject) {
      $.getJSON("https://api.mapbox.com/geocoding/v5/mapbox.places/"+lng+","+lat+".json",
        {access_token: mapboxgl.accessToken,types:"region,place,locality,neighborhood"})
       .then(function(d) {
        resolve(d.features.map(function(f) {
          return f.text;
          // return [f.text,f.place_type[0]];
        }));
       },reject);
    });
  }

  function audiosearchQuery(q) {
    return $.getJSON("https://www.audiosear.ch/api/search/episodes/"+q,
      {entities_filter:1})
  }


  $.getJSON("podcasts.json", function(podcasts) {
    // ALSO INITIALIZE THE PLAYER HERE PROBABLY

  var searchtarget = {type: "Point", coordinates: [0,0]};

  map.on('load', function() {
    $.getJSON("podcasts.json", function(podcasts) {
      setupMap(podcasts);
      addClickListener();
    });
  });

  function setupMap(podcasts) {
    map.addLayer({
      "id": "symbols",
      "type": "symbol",
      "source": {
        "type": "geojson",
        "data": podcasts
      },
      "layout": {
        "icon-image": "star-15",
        "text-field": "{name}",
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0.6],
        "text-anchor": "top"
      }
    });

    map.addSource('searchtarget', { type: 'geojson', data: searchtarget });

    map.addLayer({
      "id": "searchtarget",
      "type": "symbol",
      "source": "searchtarget",
      "layout": {
        "icon-image": "marker-15",
        'visibility': 'none'
      }
    });
  }

  var active_casts = [];
  cast_index = 0;

  function addClickListener() {
    map.on('click', 'symbols', function (e) {
        var clickedFeature = e.features[0];
        if (clickedFeature) {
          map.flyTo({center: clickedFeature.geometry.coordinates});
          active_casts = JSON.parse(clickedFeature.properties.casts);
          cast_index = 0;
          displayEpisode(active_casts[cast_index]);
        }
    });

    document.querySelector("#info>img").addEventListener("click",function() {
      cast_index = (cast_index+1)%active_casts.length;
      displayEpisode(active_casts[cast_index]);
    });

    var weAreDraggingThoseHeadphones = false;

    map.on('mouseup',function(e) {
      if (weAreDraggingThoseHeadphones) {
        var lng = e.lngLat.lng;
        var lat = e.lngLat.lat;
        searchtarget.coordinates = [e.lngLat.lng,e.lngLat.lat];
        map.getSource('searchtarget').setData(searchtarget);
        map.setLayoutProperty('searchtarget', 'visibility', 'visible');
        reverseGeocode(lat,lng).then(function(d) {
          var search_str = '"'+d.join('" "')+'"';
          console.log(search_str);
        });
          // return audiosearchQuery(search_str);
        // }).then(function(d) {
        //   console.log(d);
        // });
      };
    });

    document.querySelector(".dragsource").addEventListener("mousedown", function() {
      weAreDraggingThoseHeadphones = true;
    });

    document.addEventListener("mouseup",function() {
      weAreDraggingThoseHeadphones = false;
    });

  }

  function displayEpisode(episodeDetail) {
    showDetail(episodeDetail);
    updatePlayer(episodeDetail);
    swapDisplay();
  }

  function swapDisplay () {
    $('#iframe').removeClass('hidden');
    $('#info').removeClass('hidden');
    $('#welcome').addClass('hidden');
  }

  function showDetail (episodeDetail) {
    $('#podcast-title').html(episodeDetail[PODCAST_NAME]);
    $('#podcast-producer').html(episodeDetail[CREATOR]);
    $('#podcast-link').attr('href', episodeDetail[PODCAST_LINK]);
    $('#ep-title').html(episodeDetail[EPISODE_NAME]);
    $('#ep-feed').html(episodeDetail[PODCAST_FEED]);
    $('#ep-guid').html(episodeDetail[EPISODE_GUID]);
    $('#recommendation').html(episodeDetail[RECOMMENDATION] || DEFAULT_RECOMMENDATION);
    $('#recommender').html(episodeDetail[RECOMMENDER] || DEFAULT_RECOMMENDER);
  }

  function updatePlayer (episodeDetail) {
    var feedUrl = encodeURIComponent(episodeDetail[PODCAST_FEED]);
    var audioSrc = `${PLAYER_URL}uf=${feedUrl}`;
    if (episodeDetail[EPISODE_GUID]) {
      var epGuid = encodeURIComponent(episodeDetail[EPISODE_GUID]);
      audioSrc += `&ge=${epGuid}`;
    }
    $('#iframe').attr('src', audioSrc);
  }
});
});
