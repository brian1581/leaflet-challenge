// setup url for query
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// complete a get request from the URL
d3.json(queryUrl, function(data) {
// send the response to data.features object to a function
  createClusters(data.features);
  console.log(data.features)
});

function createClusters(eqData) {

  // setup function to run once for each feature in the array for earthquake time/place
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
  }

  // setup function for circle radius based on magnitude
  function radiusSize(magnitude) {
    return magnitude * 20000;
  }

  // setup function for circle color based on magnitude
  function circleColor(magnitude) {
    if (magnitude < 1) {
      return "#ccff33"
    }
    else if (magnitude < 2) {
      return "#ffff33"
    }
    else if (magnitude < 3) {
      return "#ffcc33"
    }
    else if (magnitude < 4) {
      return "#ff9933"
    }
    else if (magnitude < 5) {
      return "#ff6633"
    }
    else {
      return "#ff3333"
    }
  }

  // set geojson layer with a feature array from the earthquakeData object
  // use onEachFeature once for the data in the array
  var earthquakes = L.geoJSON(eqData, {
    pointToLayer: function(eqData, latlng) {
      return L.circle(latlng, {
        radius: radiusSize(eqData.properties.mag),
        color: circleColor(eqData.properties.mag),
        fillOpacity: 1
      });
    },
    onEachFeature: onEachFeature
  });

  // add the earthquakes layer to createMap function
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // define the three map layers - satellite, scale and outdoors
  var streetMap = L.tileLayer(MAPBOX_URL, {
    attribution: ATTRIBUTION,
    maxZoom: 18,
    id: "mapbox.outdoors",
    accessToken: API_KEY
  });

  var satMap = L.tileLayer(MAPBOX_URL, {
    attribution: ATTRIBUTION,
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  });

  var mapScale = L.tileLayer(MAPBOX_URL, {
    attribution: ATTRIBUTION,
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
  });

  // setup faultlines into map as a layer
  var faultLines = new L.LayerGroup();
  
  // baseMaps object to hold base layers
  var baseMaps = {
    "Street Map": streetMap,
    "Greyscale Map": mapScale,
    "Satellite Map": satMap
  };

  // setup overlay object for overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes,
    FaultLines: faultLines
  };

  // create map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 4,
    layers: [streetMap, earthquakes, faultLines]
  });

  // set layer control
  // add baseMaps and overlayMaps
  // add layer control to map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Query to retrieve the faultline data
  var faultQuery = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
  
  // setup and add faultlines to a layer
  d3.json(faultQuery, function(data) {
    L.geoJSON(data, {
      style: function() {
        return {color: "orange", fillOpacity: 0}
      }
    }).addTo(faultLines)
  })

  // setup color function
  function getColor(data) {
    return data > 5 ? '#ff3333' :
           data > 4  ? '#ff6633' :
           data > 3  ? '#ff9933' :
           data > 2  ? '#ffcc33' :
           data > 1  ? '#ffff33' :
                    '#ccff33';
  }

  // set legend to map
  var legend = L.control({position: 'bottomright'});
  
  legend.onAdd = function (map) {
  
      var div = L.DomUtil.create('div', 'info legend'),
          mags = [0, 1, 2, 3, 4, 5],
          labels = [];
  
      // forloop through density intervals and set a legend 
      // label with a colored square for each interval
      for (var i = 0; i < mags.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(mags[i] + 1) + '"></i> ' +
              mags[i] + (mags[i + 1] ? '&ndash;' + mags[i + 1] + '<br>' : '+');
      }
  
      return div;
  };
  
  legend.addTo(myMap);
};