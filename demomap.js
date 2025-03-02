///////////////////////////////////////////
// init map

var layers = [];
var overlays = [];
var zoom = 13;
var center = [13.6299684773, 52.3211886595];
var rotation = 0;
layers.push(new ol.layer.Tile({ 
    title: 'Alberding',
    type: 'base',
    source:new ol.source.XYZ({
        crossOrigin:null,
        maxZoom: 19,
        url:"http://map.gnssonline.eu/default/{z}/{x}/{y}.png",
        attributions:'<a href="//www.alberding.eu/">© Alberding GmbH</a>'
    })
}));
var layergroup = new ol.layer.Group({'title': 'Karte', layers: layers});
var overlayGroup = new ol.layer.Group({title: 'Überlagerung',layers: overlays});
var mousePositionControl = new ol.control.MousePosition({  
  coordinateFormat: function(coordinate) {
      return ol.coordinate.format(coordinate, '{y}, {x}', 6);
    },
  projection: 'EPSG:4326',  className: 'map-mouse-position'
});
var map = new ol.Map({
  layers: [layergroup,overlayGroup],
  target: document.getElementById('map'),
  controls: ol.control.defaults().extend([new ol.control.ScaleLine(), new ol.control.FullScreen(), mousePositionControl]),
  view: new ol.View({center: ol.proj.transform(center,'EPSG:4326','EPSG:3857'),zoom: zoom,rotation: rotation,minZoom: 2,maxZoom: 23,})
});
var layerSwitcher = new ol.control.LayerSwitcher({tipLabel: 'Légende'});
map.addControl(layerSwitcher);

///////////////////////////////////////////
// include WFS

const vectorSource = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  //url: 'https://pauline:bachelor2025@smarttrack.gnssonline.eu/cgi-bin/smartTrack.cgi?mod=Status&geojson=1',
  url: './points.geojson',
});

const smarttrack = new ol.layer.Vector({
  source: vectorSource,
  title: "SmartTrack WFS"
});
//console.log(vectorSource.getFeatures());

overlayGroup.getLayers().push(smarttrack);


///////////////////// by Pauline Thiele begin //////////////////////
// include air quality 
const dataFile = './hour_created_geodata copy.geojson';

const vectorSource_air = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  //url: './air.geojson',
  url: dataFile,
});

//var colorList = {excellent:'#42CAFF', good: '#9CFD8C', moderate: '#F0E641', weak: '#FF5050', poor: '#960032', unknown:'grey',};
var colorList = {excellent:'#4d9221', good: '#a1d76a', moderate: '#f7f7f7', weak: '#e9a3c9', poor: '#c51b7d', unknown:'grey',};
create_AQ_Legend(colorList); // in aq_legend.js

function getColorByAirQuality(airQuality) {
  if (airQuality == 1) {
    return colorList.excellent;
  } else if (airQuality == 2) {
    return colorList.good;
  } else if (airQuality == 3) {
    return colorList.moderate;
  } else if (airQuality == 4) {
    return colorList.weak;
  } else if (airQuality == 5){
    return colorList.poor;
  } else {
    return colorList.unknown;
  }
}

const pointStyle = function(feature) { 
  return new ol.style.Style({
    image: new ol.style.Circle({
      radius: 10,
      fill: new ol.style.Fill({ color: getColorByAirQuality(feature.get('Luftqualitätsindex'))}),
      stroke: new ol.style.Stroke({ color: 'black', width: 1 }),
    }),
  });
};


//let newestFeature = null; 
//let newestFeatures = await loadNewestFeature();



async function loadGEOJSON() {
  const response = await fetch(dataFile);
  const data = await response.json();
  console.log("data1: ", data);
  return data; 
}

// find newest feauture 
async function loadNewestFeature() {
  try {
    const data = await loadGEOJSON(); 
    const newestFeaturesByID = {};

    // sort features by ID and time 
    data.features.forEach(feature => {
      const id = feature.properties.Name; 
      const featureTime = new Date(feature.properties.time); 
      //console.log(id);
      
      if (!newestFeaturesByID[id] || featureTime > new Date(newestFeaturesByID[id].properties.time)) {
        newestFeaturesByID[id] = feature;
      }
    });

    newestFeatures = Object.values(newestFeaturesByID);
    console.log(newestFeatures); 
    smarttrack_air.changed();
    return newestFeatures; 
    /*const sortedFeatures = data.features.sort((a, b) => 
      new Date(b.properties.time) - new Date(a.properties.time)
    );
    newestFeature = sortedFeatures[0];*/

    // refresh layer
    

  } catch (error) {
    console.error("Fehler beim Laden der GeoJSON-Daten:", error);
  }
}

const smarttrack_air = new ol.layer.Vector({
  source: vectorSource_air,
  title: "Air Quality",
  style: function (feature) {
    // Prüfen, ob das aktuelle Feature in newestFeatures enthalten ist
    const isNewest = newestFeatures.some(newestFeature =>
      feature.getId() === newestFeature.id || 
      feature.get('id') === newestFeature.id
    );

    // Falls das Feature in newestFeatures ist, wende den Style an, sonst kein Style
    return isNewest ? pointStyle(feature) : null;
  },
  visible: true,
});

let newestFeatures = loadNewestFeature(); // -------------------------------------------------------------------------------------------> was von beiden ist hier jetzt besser? 
//let feature = loadNewestFeature();

// Function to toggle legend visibility
function toggleVisibility() {
  var air_legend = document.getElementById('air_legend');
  var air_searchbar = document.getElementById('searchbar'); 
  if (smarttrack_air.getVisible()) {
    air_legend.style.display = 'block';
    air_searchbar.style.display = 'block'; 
  } else {
    air_legend.style.display = 'none';
    air_searchbar.style.display = 'none'; 
  }
}

// Add event listener to toggle legend visibility when layer visibility changes
smarttrack_air.on('change:visible', toggleVisibility);

// Initial call to set the correct visibility on load
toggleVisibility();

console.log(vectorSource_air.getFeatures());

overlayGroup.getLayers().push(smarttrack_air);

// change size of points on map 
const pointStyleLarge = function(feature) { 
  const airQuality = feature.get('Luftqualitätsindex');
  const color = getColorByAirQuality(airQuality);
  //console.log("Color transparency: ", (color + '80')); 

  return [
    new ol.style.Style({
      geometry: function (feature) {
        return feature.getGeometry();
      },
      image: new ol.style.Circle({
        radius: 30,
        fill: new ol.style.Fill({ color: color + '80' }), // Halbtransparenter Kreis
        stroke: new ol.style.Stroke({ color: color, width: 1 }),
      }),
    }),
    new ol.style.Style({
      geometry: function (feature) {
        return feature.getGeometry();
      },
      image: new ol.style.Circle({
        radius: 10,
        fill: new ol.style.Fill({ color: color }), // Kleinere volle Farbe
        stroke: new ol.style.Stroke({ color: 'black', width: 1 }),
      }),
    })
  ];
};

let hoveredFeature = null;
let selectedFeature = null;

// Add event listener for pointermove to handle hover effect
map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel, function(feature, layer) {
    return layer === smarttrack_air;
  });

  map.getTargetElement().style.cursor = hit ? 'pointer' : '';

  // bei der Mausbewegung wird der Kreis wieder kleiner aber der andere nicht groß --> check das mal Pauline 
  map.forEachFeatureAtPixel(pixel, function(feature, layer) {
    if (layer === smarttrack_air) {
      if (hoveredFeature && hoveredFeature !== feature && hoveredFeature !== selectedFeature) {
        hoveredFeature.setStyle(pointStyle(hoveredFeature));
      }
      if (feature !== selectedFeature) {
        feature.setStyle(pointStyleLarge(feature));
      }
      //feature.setStyle(pointStyleLarge(feature));
      hoveredFeature = feature;
    }
  });

  if (!hit && hoveredFeature && hoveredFeature !== selectedFeature) {
    hoveredFeature.setStyle(pointStyle(hoveredFeature));
    hoveredFeature = null;
  }
});


// Search function is in file "aq_searchbar.js". 
initSearch(); 


/* by Pauline Thiele end */

///////////////////////////////////////////
// Popup handler
function initPopUp()
{
  var container = document.getElementById('popup');
  var containerAQ = document.getElementById('popup-AQ');
  var content = document.getElementById('popup-content');

  /* by Pauline Thiele begin */
  var contentAQ = document.getElementById('popup-content-AQ'),
    closer = document.getElementById('popup-closer'),
    closerAQ = document.getElementById('popup-closer-AQ'); 

  const popUpSection = document.getElementById('popUpSection'),
    dailogHM3301 = document.getElementById('dailogHM3301'),
    dailoglastRow = document.getElementById('dialogLastRow');
  /* by Pauline Thiele end */

  /**
    * Create an overlay to anchor the popup to the map.
    */
  var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
    element: container,
    autoPan: true,
    autoPanMargin: 35,
    autoPanAnimation: {
      duration: 250
    }, 
    id: 'popup_overlay'
  }));
  map.addOverlay(overlay);
  
  /**
    * Create an overlay for AQ to anchor the popup to the map.
    * by Pauline Thiele
    */
  var overlayAQ = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
    element: containerAQ,
    autoPan: true,
    autoPanMargin: 35,
    autoPanAnimation: {
      duration: 250
    }, 
    id: 'popup_overlay_AQ'
  }));
  map.addOverlay(overlayAQ);

  /**
    * Add a click handler to hide the popup.
    * @return {boolean} Don't follow the href.
    */
  closer.onclick = function() {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };

  /**
    * Add a click handler to hide the popup.
    * @return {boolean} Don't follow the href.
    * by Pauline Thiele 
    */
  closerAQ.onclick = function() {
    overlayAQ.setPosition(undefined);
    closer.blur();
    selectedFeature.setStyle(pointStyle(selectedFeature));
    selectedFeature = null;
    return false;
  };
  
  /**
    * Add a click handler to the map to render the popup.
    * hier nochmal durchgehen und checken was von mir ist und was nicht!!!!!!!!!!!!!!!!!!!!!!!!!
    */
  map.on('singleclick', function(evt) {
    var coordinate = evt.coordinate;
    var result = map.forEachFeatureAtPixel(evt.pixel,
        function(feature, layer) {
          return { feature, layer };
        });
    
      if (result) {
        var feature = result.feature;
        var layer = result.layer;

        // Perform actions with the feature and layer
        console.log(feature.getProperties());
      } else {
        console.log('No feature found at the clicked position.');
      }
 
    /* macht gerade nichts!!! 
    var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(
        coordinate, 'EPSG:3857', 'EPSG:4326'));*/

    /* warum habe ich das rausgenommen???? 
    if (feature && feature.get('description') !== undefined) {
      content.innerHTML = feature.get('description');
      overlay.setPosition(coordinate);
      return;
    }
    else if */
    const sidebarwidth = document.getElementById("sidebar").offsetWidth;
    if (feature && feature.getProperties() !== undefined) {
      if (layer === smarttrack_air) {
        
        console.log("sidebarwidth: ", sidebarwidth); 
        if ((selectedFeature && selectedFeature !== feature && sidebarwidth > 10) || (selectedFeature && selectedFeature === feature && sidebarwidth > 10)) { // wenn sidebar offen auf anderen Punkt klicken 
          selectedFeature.setStyle(pointStyle(selectedFeature));
          openSidebar(feature);
          selectedFeature = feature;
        }
        else if ((selectedFeature && selectedFeature === feature) || (selectedFeature !== feature && sidebarwidth <= 10)) { // klick auf einen Punkt wenn nichts oder popup von anderem Punkt offen ist 
          /*content.innerHTML = ''; 
          contentAQ.innerHTML = ''; */
          // Popup logic for air.geojson
          let insertedContent = document.querySelectorAll(".insertedContent");

          if(insertedContent) {
            for (var i = 0; i < insertedContent.length; i++)  insertedContent[i].remove();
          }

          console.log(feature.getProperties());
          
          let html = `  <p class="dialogTimestamp insertedContent">Last Update at: <br> ${feature.get('time') || 'Unknown'}</p>
                        <p id="station" class ='dialogContent insertedContent'>Station: ${feature.get('Name') || 'Unknown'}</p>
                        <p id="AQI" class ='dialogContent insertedContent'>Air Quality Index: </p>
                        <p id="dailogMv" class="dialogContent insertedContent">Measurement Values:</p>`;
          popUpSection.insertAdjacentHTML('afterbegin', html);

          html = `  <td rowspan="2" class ='insertedContent'>${feature.get('NO2') || 'Unknown'}</td>
                    <td rowspan="2" class ='insertedContent'>${feature.get('CO') || 'Unknown'}</td>`;
          dailogHM3301.insertAdjacentHTML('afterend', html);

          //TODO: Klassennamen nicht mit Unterstrichen!! 
          html = `  <td class ='insertedContent'>${feature.get('SD:PM2_5') || 'Unknown'}</td>
                    <td class="tb_child_even insertedContent">${feature.get('GM:PM2_5_Atm') || 'Unknown'}</td> 
                    <td class="tb_child_uneven insertedContent">${feature.get('SD:PM10') || 'Unknown'}</td>
                    <td class ='insertedContent'>${feature.get('GM:PM10_Atm') || 'Unknown'}</td>`;
          dailoglastRow.insertAdjacentHTML('afterbegin', html);

          var AqIndex = document.getElementById("AQI");
          AqIndex.insertBefore(createColoredAqDiv(feature.getProperties()['Luftqualitätsindex']), AqIndex.children[0]); 

          window.openSidebarHelper = function() {
            openSidebar(feature);
            //closer.onclick();
            overlayAQ.setPosition(undefined);
            closerAQ.blur();
            //feature.setStyle(pointStyleLarge(feature));
          };

          console.log("feature: ", feature); 
          console.log("selectedFeature: ", selectedFeature); 
          if(selectedFeature) {
            selectedFeature.setStyle(pointStyle(selectedFeature));
          }
          
          selectedFeature = feature;
          selectedFeature.setStyle(pointStyleLarge(selectedFeature));
          

          //contentAQ.innerHTML = airQualityContent;
          overlayAQ.setPosition(coordinate);
          return;
        }
      } else {
        content.innerHTML = ''; 
        contentAQ.innerHTML = ''; 

        // Popup logic for points.geojson
        var table = "<table class=\"mapMarkerInfo\">\n";
        var yourobject = feature.getProperties();
        let valid = 0;
        for (let key in yourobject)
        {
          if(key != 'geometry') {
            table = table + "<tr><td>" + key + "</td><td>" + yourobject[key] + "</td></tr>\n";
            valid = 1;
          }
        }
        if(valid)
        {
          table = table + "<table>\n";
          content.innerHTML = table;
          overlay.setPosition(coordinate);
        }
        console.log(feature);
      }
    }  
  });
}
