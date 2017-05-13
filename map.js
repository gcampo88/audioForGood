$(document).ready(function () {
  LOCATION = 'Location';
  PODCAST_NAME = 'Name of Podcast';
  PODCAST_LINK =  'Podcast Site URL';
  PODCAST_FEED = 'RSS Feed';
  CREATOR = 'Creator(s)/Lead Producer Name';
  EPISODE_NAME = 'Name of Episode';
  RECOMMENDATION = 'Recommendation Notes';
  RECOMMENDER = 'Team Six Assignee';

  mapboxgl.accessToken = 'pk.eyJ1IjoibWNsYXVnaGxpbiIsImEiOiJjajBwZmpnbDkwMHQxMzNud2ZtandkbGN5In0.pa7_xZbE3ZDF-cfFedFHjw';

  var map = new mapboxgl.Map({
    container: 'map',
    center: [-95, 38],
    zoom: 0.5,
    style: 'mapbox://styles/mapbox/light-v9'
  });


  $.getJSON("podcasts.json", function(podcasts) {
    // ALSO INITIALIZE THE PLAYER HERE PROBABLY

  map.on('load', function() {
    setupMap();
    addClickListener();
  });

  function setupMap() {

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
  }

  function addClickListener() {
    map.on('click', 'symbols', function (e) {
        var clickedFeature = e.features[0];
        map.flyTo({center: clickedFeature.geometry.coordinates});
        $('#iframe').attr('src', "http://play.prx.org/e?uf=http%3A%2F%2Ffeeds.prx.org%2Ftransistor_stem&gs=_blank");
        var episodeDetail = JSON.parse(e.features[0].properties.casts)[0];
        showDetail(episodeDetail);
        updatePlayer(episodeDetail);
    });
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
    $('#info').removeClass('hidden');
    $('#iframe').removeClass('hidden');
    $('#welcome').addClass('hidden');
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
