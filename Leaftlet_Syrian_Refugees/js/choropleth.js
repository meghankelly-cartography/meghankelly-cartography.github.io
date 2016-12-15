function createMap(){
    //create the map
    var map = L.map('map', {
        center: [54, 10],
        zoom: 3
    });

    //add OSM base tilelayer
	L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	}).addTo(map);
	
	getData2(map);
};


//Import GeoJSON data
function getData2(map){
    //load the data with callback function
    $.ajax("data/europeData.geojson", {
        dataType: "json",
        success: function(response){

           //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(response, {style: style}).addTo(map);
            L.control.layers(response).addTo(map);
        }
    });
};

function getColor(d) {
    return d > 10000000 ? '#08519c' :
           d > 5000000  ? '#3182bd' :
           d > 2000000  ? '#6baed6' :
           d > 1000000  ? '#bdd7e7' :
           d > 500000   ? '#eff3ff' :
                      'white';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.pop_est),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}




$(document).ready(createMap);