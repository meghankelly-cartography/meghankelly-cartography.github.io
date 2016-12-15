//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [54, 10],
        zoom: 3
    });

	L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	}).addTo(map);

    //call getData function
    getData(map);
};

//Global variable that will house the control panel
var control;

//FIFTH INTERACTION OPERATOR
//OVERLAY showing number of refugees as a percentage of the host country's population
//The next three functions apply to my overlay 
//The first function gets my data and adds it to the control
//The second two functions define styles and classifications within the choropleth overlay
//Import GeoJSON data for the fifth interaction operator
function getDataChoro(map){
    //load the data with callback function
    $.ajax("data/europeData.geojson", {
        dataType: "json",
        success: function(response){

            choropleth = response;
           //create a Leaflet GeoJSON layer and add it to the map
            //L.geoJson(choropleth, {style: style}).addTo(map);
        
        
            var a = L.geoJson(choropleth, {style: style});
            
            //ADD FIFTH OPERATOR (OVERLAY) TO CONTROL PANEL
            control.addOverlay(a, "Choropleth");
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
        fillOpacity: 0.6
    };
}



//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = .4;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    
    var attribute = attributes[0];
    
    //check, this works
    console.log(attribute);
    
    //console.log("This is also working!");
	
	//Create marker options
	var options = {
		//fillColor: "blue",
		color: "white",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.6,
	};
	
	//For each feature, determine its value for the selected attribute
	var attValue = Number(feature.properties[attribute]);
	
	//Give each feature's circle marker a radius based on its attribute value
	options.radius = calcPropRadius(attValue);
	
	//create circle marker layer
	var layer = L.circleMarker(latlng, options);
	
	//build popup content string starting with city...Example 2.1 line 24
    var popupContent = "<p><b>Country:</b> " + feature.properties.Country + "</p>";

    //add formatted attribute to popup content string
    var month = attribute.split("_")[1];
    popupContent += "<p><b>Month:</b> " + attribute +"</p>";
    
    //add formatted attribute to popup content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Number of asylum seekers:</b> " + feature.properties[attribute] + "</p>";
    
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius)
    });

    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }
    });
    
	
	//return the circle marker to the L.geojson pointToLayer option
	return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    var b = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    });
    
    
	//Creates structure within control panel
    var overlayMaps = {
    	"Sequence": b
    };
    
    //ADDS THE CONTROL PANEL FOR THE FIFTH INTERACTION OPERATOR
	control = L.control.layers(null, overlayMaps).addTo(map);
    //Default proportional symbols to map on load
    b.addTo(map);
    
    //Call ajax function to get the data for choropleth
    getDataChoro(map);
        
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){

        map.eachLayer(function(layer, feature){
            if (layer.feature && layer.feature.properties[attribute]){
                        //access feature properties
                        var props = layer.feature.properties;

                        //update each feature's radius based on new attribute values
                        var radius = calcPropRadius(props[attribute]);
                        layer.setRadius(radius);

                        //add city to popup content string
                        var popupContent = "<p><b>City:</b> " + props.Country + "</p>";

                        var month = attribute.split("_")[1];
                         popupContent += "<p><b>Month:</b> " + attribute +"</p>";

                        //add formatted attribute to panel content string
                        var year = attribute.split("_")[1];
                        popupContent += "<p><b>Number of asylum seekers:</b> " + layer.feature.properties[attribute] + "</p>";

                        //replace the layer popup
                        layer.bindPopup(popupContent, {
                            offset: new L.Point(0,-radius)
                        });
                    }; //end of if statement
        });  
        
    //update sequence legend
	updateLegend(map, attribute);    
};

function updateLegend(map, attribute){
	//create content for legend
	var month = attribute.split("_")[1];
	var content = month + " 2015";

	//replace legend content
	$('#temporal-legend').html(content);
};


//Create new sequence controls
function createSequenceControls(map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

		//Example 2.3 line 1
        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');

            //add skip buttons
            //$(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            //$(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');
			
			//Below Example 3.5...replace button content with images
   			//$('#reverse').html('<img src="img/reverse2.png">');
    		//$('#forward').html('<img src="img/forward2.png">');
    
			//kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });

            return container;
        }

    });

    map.addControl(new SequenceControl());
    
    //set slider attributes
    $('.range-slider').attr({
        max: 11,
        min: 0,
        value: 0,
        step: 1
    });
    
    //Below Example 3.5...replace button content with images
    $('#reverse').html('<img src="img/reverse2.png">');
    $('#forward').html('<img src="img/forward2.png">');
    
   //click listener for buttons
	$('.skip').click(function(){
		//get the old index value
		var index = $('.range-slider').val();

		//increment or decriment depending on button clicked
		if ($(this).attr('id') == 'forward'){
			index++;
			//if past the last attribute, wrap around to first attribute
			index = index > 11 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse'){
			index--;
			//if past the first attribute, wrap around to last attribute
			index = index < 0 ? 11 : index;
		};

		//update slider
		$('.range-slider').val(index);

		//pass new attribute to update symbols
		updatePropSymbols(map, attributes[index]);
	});

	//input listener for slider
	$('.range-slider').on('change', function(){
		//get the new index value
		var index = $(this).val();

        console.log(index);
		//pass new attribute to update symbols
		updatePropSymbols(map, attributes[index]);
	});
};


	//empty array to hold attributes
	var attributes = [];

//Above Example 3.8...Step 3: build an attributes array from the data
function processData(data){
	
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("month_") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

//Import GeoJSON data
function getData(map){
    //load the data with callback function
    $.ajax("data/Europe.geojson", {
        dataType: "json",
        success: function(response){

            //console.log(response.features[1].properties)
            //console.log(response.features)

            // create array of attributes
            var attributes = processData(response);

            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);

			//call function to create sequence control
            createSequenceControls(map, attributes);
            
            createLegend(map, attributes);
        }
    });
};

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

			//add temporal legend div to container
			$(container).append('<div id="temporal-legend">')
				
            console.log("This works, here!");
            
            return container;
        }
    });

    map.addControl(new LegendControl());
    
    updateLegend(map, attributes[0]);
};

$(document).ready(createMap);
