/**
 * ------ Air Quality Website ------
 * 
 * Shows the map as a background and includes layers. 
 * 
 * Author: Pauline Thiele 
 */



/**
 * Initialize OpenStreetMap (OSM).
 */

var layers = [];
var overlays = [];
var zoom = 13;
var center = [13.6299684773, 52.3211886595];
var rotation = 0;

layers.push(new ol.layer.Tile({ 
    title: 'OSM',
    type: 'base',
    source:new ol.source.XYZ({
        crossOrigin:null,
        maxZoom: 19,
        url:"http://map.gnssonline.eu/default/{z}/{x}/{y}.png"
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

var layerSwitcher = new ol.control.LayerSwitcher({tipLabel: 'Legende'});
map.addControl(layerSwitcher);


/**
 * Includes Air Quality Layer. 
 */
const dataFile = './hour_created_geodata copy.geojson';

const vectorSourceAir = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  //url: './air.geojson',
  url: dataFile,
});


// colors for AQ Legend
var colorList = {excellent:'#4d9221', good: '#a1d76a', moderate: '#f7f7f7', weak: '#e9a3c9', poor: '#c51b7d', unknown:'grey',};

/**
 * Gets color string by air quality level. 
 * @param {number} airQuality 
 * @returns {string}
 */
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


/**
 * Returns the OpenLayers default style for a point based on its air quality index.
 * @param {object} feature 
 * @returns {ol.style.Style}
 */
const pointStyle = function(feature) { 
  return new ol.style.Style({
    image: new ol.style.Circle({
      radius: 10,
      fill: new ol.style.Fill({ color: getColorByAirQuality(feature.get('Luftqualitätsindex'))}),
      stroke: new ol.style.Stroke({ color: 'black', width: 1 }),
    }),
  });
};


/**
 * Returns the OpenLayers selected style for a point based on its air quality index.
 * @param {object} feature 
 * @returns {ol.style.Style}
 */
const pointStyleLarge = function(feature) { 
  const airQuality = feature.get('Luftqualitätsindex');
  const color = getColorByAirQuality(airQuality);

  return [
    // half transparent bigger circle
    new ol.style.Style({
      geometry: function (feature) {
        return feature.getGeometry();
      },
      image: new ol.style.Circle({
        radius: 30,
        fill: new ol.style.Fill({ color: color + '80' }), 
        stroke: new ol.style.Stroke({ color: color, width: 1 }),
      }),
    }),

    // not transparent smaller circle
    new ol.style.Style({
      geometry: function (feature) {
        return feature.getGeometry();
      },
      image: new ol.style.Circle({
        radius: 10,
        fill: new ol.style.Fill({ color: color }), 
        stroke: new ol.style.Stroke({ color: 'black', width: 1 }),
      }),
    })
  ];
};


//let newestFeature = null; 
//let newestFeatures = await loadNewestFeature();


/**
 * Loads and returns data from .geojson file. 
 * @returns {object}
 */
async function loadGEOJSON() {
  const response = await fetch(dataFile);
  const data = await response.json();
  console.log("data1: ", data);
  return data; 
}


// new array for newestFeatures
var newestFeatures = []; 


/**
 * Find newest feature for each point ID. 
 * @returns {object}
 */
async function loadNewestFeature() {
  try {
    const data = await loadGEOJSON(); 
    const newestFeaturesByID = {};

    // get newest features by ID 
    data.features.forEach(feature => {
      const id = feature.properties.Name; 
      const featureTime = new Date(feature.properties.time); 
      
      if (!newestFeaturesByID[id] || featureTime > new Date(newestFeaturesByID[id].properties.time)) {
        newestFeaturesByID[id] = feature;
      }
    });

    newestFeatures = Object.values(newestFeaturesByID);
    smarttrackAir.changed();
    console.log("newestFeatures: ", newestFeatures); 
    return newestFeatures;  

  } catch (error) {
    console.error("Fehler beim Laden der GeoJSON-Daten:", error);
  }
}


newestFeatures = loadNewestFeature(); 
create_AQ_Legend(colorList); // in aq_legend.js


/**
 * Creates "Air Quality" layer with newest feature points. 
 */
const smarttrackAir = new ol.layer.Vector({
  source: vectorSourceAir,
  title: "Air Quality",
  style: function (feature) {
    // check if feature is in newestFeatures
    const isNewest = (Array.isArray(newestFeatures) ? newestFeatures : []).some(newestFeature =>
      feature.getId() === newestFeature.id || 
      feature.get('id') === newestFeature.id
    );
    isNewest ? console.log("Features on map: ", feature) : null; 

    // only apply style to newestFeatures 
    return isNewest ? pointStyle(feature) : null;
  },
  visible: true,
});


/**
 * Toggles legend and searchbar visibility based on layer visibility. 
 */
function toggleVisibility() {
  var airLegend = document.getElementById('air_legend');
  var airSearchbar = document.getElementById('searchbar'); 
  if (smarttrackAir.getVisible()) {
    airLegend.style.display = 'block';
    airSearchbar.style.display = 'block'; 
  } else {
    airLegend.style.display = 'none';
    airSearchbar.style.display = 'none'; 
  }
}


// Add event listener to toggle legend and searchbar visibility when layer visibility changes. 
smarttrackAir.on('change:visible', toggleVisibility);

// Initial call to set the correct visibility on load.
toggleVisibility();

// show smarttrackAir layer 
overlayGroup.getLayers().push(smarttrackAir);


var hoveredFeature = null;
var selectedFeature = null;

// Add an event listener on pointermove to handle hover effect of feature points. 
map.on('pointermove', function(evt) {
  if (evt.dragging) return;

  var pixel = map.getEventPixel(evt.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel, function(feature, layer) {
    return layer === smarttrackAir;
  });

  map.getTargetElement().style.cursor = hit ? 'pointer' : '';


  let newHoveredFeature = null;

  // set pointStyleLarge for each feature in smarttrackAir that is hovered and is not selected
  map.forEachFeatureAtPixel(pixel, (feature, layer) => {
    if (layer === smarttrackAir) {
      newHoveredFeature = feature;
      if (feature !== selectedFeature) {
        feature.setStyle(pointStyleLarge(feature));
      }
    }
  });

  // set pointStyle for previously hovered feature if its no longer hovered or selected
  if (hoveredFeature && hoveredFeature !== selectedFeature && hoveredFeature !== newHoveredFeature) {
    hoveredFeature.setStyle(pointStyle(hoveredFeature));
  }

  hoveredFeature = newHoveredFeature;
});



/**
 * Manages AQ Popup visualisation. 
 */
function initPopUp()
{
  var containerAQ = document.getElementById('popup-AQ'), 
      closerAQ = document.getElementById('popup-closer-AQ'); 

  const popupTable = document.getElementById('popupTable'),
        colHM3301 = document.getElementById('colHM3301'),
        tableLastRow = document.getElementById('tableLastRow');
  
  /**
    * Create an overlay for AQ to anchor the popup to the map.
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
  closerAQ.onclick = function() {
    overlayAQ.setPosition(undefined);
    closer.blur();
    selectedFeature.setStyle(pointStyle(selectedFeature));
    selectedFeature = null;
    filterFeatures(); // in aq_legend.js
    return false;
  };
  
  /**
    * Add a click handler to the map to render the popup.
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
    
    const sidebarwidth = document.getElementById("sidebar").offsetWidth;

    if (feature && feature.getProperties() !== undefined) {
      if (layer === smarttrackAir) {
        
        console.log("sidebarwidth: ", sidebarwidth); 

        // if feature was selected and sidebar is open 
        if ((selectedFeature && selectedFeature !== feature && sidebarwidth > 10) || (selectedFeature && selectedFeature === feature && sidebarwidth > 10)) { 
          
          // reset point style and open sidebar for selected feature 
          selectedFeature.setStyle(pointStyle(selectedFeature));
          openSidebar(feature);
          filterFeatures(); // in aq_legend.js
          selectedFeature = feature;
        }

        // if feature was selected and sidebar is not open --> show popup 
        else if ((selectedFeature && selectedFeature === feature) || (selectedFeature !== feature && sidebarwidth <= 10)) { 
          
          // Popup logic for air.geojson
          let insertedContent = document.querySelectorAll(".insertedContent");

          // remove all existing content 
          if(insertedContent) {
            for (var i = 0; i < insertedContent.length; i++)  insertedContent[i].remove();
          }

          console.log(feature.getProperties());
          
          // create new content 
          let html = `  <p class="popupTimestamp insertedContent">Last Update at: <br> ${feature.get('time') || 'Unknown'}</p>
                        <p id="station" class ="popupContent insertedContent">Station: ${feature.get('Name') || 'Unknown'}</p>
                        <p id="AQI" class ="popupContent insertedContent">Air Quality Index: </p>
                        <p id="popupMV" class="popupContent insertedContent">Measurement Values:</p>`;
          popupTable.insertAdjacentHTML('afterbegin', html);

          html = `  <td rowspan="2" class ="insertedContent">${feature.get('NO2') || 'Unknown'}</td>
                    <td rowspan="2" class ="insertedContent">${feature.get('CO') || 'Unknown'}</td>`;
          colHM3301.insertAdjacentHTML('afterend', html);

          html = `  <td class ="insertedContent">${feature.get('SD:PM2_5') || 'Unknown'}</td>
                    <td class="tbChildEven insertedContent">${feature.get('GM:PM2_5_Atm') || 'Unknown'}</td> 
                    <td class="tbChildUneven insertedContent">${feature.get('SD:PM10') || 'Unknown'}</td>
                    <td class ="insertedContent">${feature.get('GM:PM10_Atm') || 'Unknown'}</td>`;
          tableLastRow.insertAdjacentHTML('afterbegin', html);

          var AqIndex = document.getElementById("AQI");
          AqIndex.insertBefore(createColoredAqDiv(feature.getProperties()['Luftqualitätsindex']), AqIndex.children[0]); 

          window.openSidebarHelper = function() {
            openSidebar(feature);
            overlayAQ.setPosition(undefined);
            closerAQ.blur();
          };

          if(selectedFeature) {
            selectedFeature.setStyle(pointStyle(selectedFeature));
          }
          
          selectedFeature = feature;
          selectedFeature.setStyle(pointStyleLarge(selectedFeature));
          filterFeatures(); // in aq_legend.js
          overlayAQ.setPosition(coordinate);
          return;
        }
      } 
    }  
  });
}
