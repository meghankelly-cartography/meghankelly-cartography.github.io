//function to load Leaflet map
function createMap(){
    //create map and set map parameters and constraints
    var map = L.map('map', {
        center: [50, 23],
        zoom: 3,
        minZoom: 3,
        maxZoom: 5,
        zoomControl: false
    });

	//add zoom control that returns viewer to original zoom level
	map.addControl(new L.Control.ZoomMin())
	
	//load OSM tile set and add to map
	L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	}).addTo(map);

    //call getData function
    //this function uses ajax to load point data for proportional symbolization
    getData(map);
};

//set global variable that will house the overlay control panel
var control;

//function that will load choropleth overlay data
function getDataChoro(map){
    //load the data with callback function
    $.ajax("data/refugee_country.json", {
        dataType: "json",
        success: function(response){
			
			//set variable to house data response with style
            var a = L.geoJson(response, {style: style});
            
            //add variable with response data to overlay panel
            control.addOverlay(a, "Europe's problem?");
        }
    });
};

//function that classifies and applies color swatches to choropleth data
function getColor(d) {
    return d > 10 		? 	'#08519c' :
           d > 2  		? 	'#3182bd' :
           d > 0.75  	? 	'#6baed6' :
           d > 0.15  	? 	'#bdd7e7' :
           d > 0   		? 	'#eff3ff' :
                          'white';
}

//function that sets the attribute being mapped (refugees/host population)
//also sets styling of line weights and fills
function style(feature) {
    return {
        fillColor: getColor(feature.properties.Ref_Pop_pe),
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
    var scaleFactor = .1;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//convert point markers to circle markers
function pointToLayer(feature, latlng){
    
    var attribute = attributes[0];
	
	//marker styling
	var options = {
		color: "white",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.8
	};
	
	//define the attribute value for each feature
	//attribute is number of asylum seekers 
	var attValue = Number(feature.properties[attribute]);
	
	//give circle marker a radius based on its attribute value
	options.radius = calcPropRadius(attValue);
	
	//create circle marker layer
	var layer = L.circleMarker(latlng, options);
	
	//build popup content string with country name
    var popupContent = "<p><b>Country:</b> " + feature.properties.Country + "</p>";

    //add month information to attribute string in popup
    var month = attribute.split("_")[1];
    popupContent += "<p><b>Month:</b> " + month +"</p>";
    
    //add and format attribute info (number of asylum seekers) to popup content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Number of Refugees:</b> " + feature.properties[attribute] + "</p>";
    
    //bind popup and content to marker and offset popup to avoid overlap
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

//add circle markers (proportional symbols) for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    var b = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    });
    
	//variable to houses prop data that will be added to control panel
    var overlayMaps = {
    	"Influx into Europe": b
    };
    
    //add control panel and add the prop data to the overlay panel
	control = L.control.layers(null, overlayMaps).addTo(map);
    
    //load proportional symbols to map as default on load
    b.addTo(map);
    
    //call ajax function to get the data for choropleth
    getDataChoro(map);
};

//resize proportional symbols based on new/updated attribute values
function updatePropSymbols(map, attribute){
		
	//access all map layers
	map.eachLayer(function(layer, feature){
        
        //SQL to only select layers that are features that have attribute value   
        if (layer.feature && layer.feature.properties[attribute]){
                        
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

			//popup content string with country name
            var popupContent = "<p><b>City:</b> " + props.Country + "</p>";

    		//add month information to attribute string in popup
			 var month = attribute.split("_")[1];
            popupContent += "<p><b>Month:</b> " + month + "</p>";

    		//add and format attribute info (number of asylum seekers) to popup content string
            var year = attribute.split("_")[1];
        	popupContent += "<p><b>Number of Refugees:</b> " + layer.feature.properties[attribute] + "</p>";

            //replace the layer popup
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });
    	}; //end of if statement
	});  
        
    //update sequence legend
	updateLegend(map, attribute);    
};


//calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

	//access all map layers
	map.eachLayer(function(layer){
	
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

function updateLegend(map, attribute){
	//create content for legend
	var month = attribute.split("_")[1];
	var content = month + " 2015";

	//replace legend content
	$('#temporal-legend').html(content);
	
	//get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
    
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //assign the cy and radius attributes
        $('#'+key).attr({
            cy: 59 - radius,
            r: radius
        });
        
        //add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " refugees");
    };
};


//function to create sequence/temporal control
function createSequenceControls(map, attributes){   
    
    //add control and set position, in this case, bottomleft
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
		
		//set parameters on load
        onAdd: function (map) {
            //create the control container with a particular class name
            //style in css
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create slider
            $(container).append('<input class="range-slider" type="range">');
    
			//kill any mouse event listeners on the map
			//helps prevent unintended zooming when using slider bar
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });

            return container;
        }
    });

	//actually add control
    map.addControl(new SequenceControl());
    
    //set slider attributes including the number attributes (an array of 12 months) and the steps through array
    $('.range-slider').attr({
        max: 11,
        min: 0,
        value: 0,
        step: 1
    });
    
   //click listener for buttons
   //might not need these?
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

//global variable to hold attributes (monthly asylum data) in an array
var attributes = [];

//function to build an attributes array from the data
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

    return attributes;
};

//import point GeoJSON data
function getData(map){

    //load the data with callback function
    $.ajax("data/Europe.geojson", {
        dataType: "json",
        success: function(response){

            // create array of attributes
            var attributes = processData(response);

            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);

			//call function to create sequence control
            createSequenceControls(map, attributes);
            
            //call function to create legend
            createLegend(map, attributes);
        }
    });
};

//function to create temporal and attribute legend
function createLegend(map, attributes){

    //add control and set position, in this case, bottomright
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

			//add temporal legend div to container
			$(container).append('<div id="temporal-legend">')
				
			//start attribute legend svg string
        	var svg = '<svg id="attribute-legend" width="200px" height="200px">';

        	//object to base loop on
        	var circles = {
            	max: 20,
            	mean: 40,
            	min: 60
        };

        //loop to add each circle and text to svg string
        for (var circle in circles){
            //circle string with styling
            svg += '<circle class="legend-circle" id="' + circle + '" fill="white" fill-opacity="0.8" stroke="white" cx="30"/>';

            //create text string
            svg += '<text class="legend-text" id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
        };

        	//close svg string
        	svg += "</svg>";

        	//add attribute legend svg to container
        	$(container).append(svg);
            
            return container;
        }
    });

	//actually add controls to map layout
    map.addControl(new LegendControl());
    
    //call updateLegend function that will temporally update the text and circle sizes
    updateLegend(map, attributes[0]);
};

//FINALLY, Load map when ready!
$(document).ready(createMap);
