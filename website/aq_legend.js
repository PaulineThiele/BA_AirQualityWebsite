/**
 * ------ Air Quality Legend ------
 * 
 * Placed at the bottom left of the website.
 * 
 * Shows the meaning of the colored station points on the map. 
 * Next to each colored circle is a checkbox, which controls the visibility of the stations on the map. 
 * The Link at the bottom refers to the used categorisation. 
 * 
 * Author: Pauline Thiele 
 */

/**
 * Creates air quality legend. 
 * @param {object} colorList 
 */
function create_AQ_Legend(colorList) {

  var airLegend = document.getElementById('air_legend'),
      title = document.createElement("H4");

  airLegend.innerHTML = '';    
  title.id = "aqi_title"; 
  title.innerHTML = "Legend: Air Quality Index";
  airLegend.appendChild(title);

  // Creates for every key in colorList a new line with checkbox, circle and text. 
  for (var key in colorList) {
    var legendContainer = document.createElement("DIV");
    legendContainer.className = "legendContainer";
    var checkbox = document.createElement("INPUT");
    var circle = document.createElement("DIV");
    var label = document.createElement("SPAN");

    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.className = "legendCheckbox";
    checkbox.id = `checkbox-${key}`;

    circle.className = "circle";
    circle.style.backgroundColor = colorList[key]; 
    
    label.innerHTML = key;
    
    legendContainer.appendChild(checkbox);
    legendContainer.appendChild(circle);
    legendContainer.appendChild(label);

    airLegend.appendChild(legendContainer);

    checkbox.addEventListener('change', function() {
      filterFeatures();
    });
  }
    
  var infoLinkDif = document.createElement("DIF"); 
  var infoLink = document.createElement("A"); 

  infoLinkDif.id = "link_legend"; 
  infoLinkDif.innerHTML = "Link: "
  infoLink.href = "https://www.umweltbundesamt.de/berechnungsgrundlagen-luftqualitaetsindex"; 
  infoLink.innerHTML = "legend information"; 
  infoLink.target = "_blank";
  infoLinkDif.appendChild(infoLink); 
  airLegend.appendChild(infoLinkDif);
}


/**
 * Returns air quality key by given level 
 * @param {number} airQuality 
 * @returns {string}
 */
function getAQKeyByLevel(airQuality) {
  if(airQuality == 1) {
    return 'excellent'; 
  } else if(airQuality == 2) {
    return 'good';
  } else if(airQuality == 3) {
    return 'moderate';
  } else if(airQuality == 4) {
    return 'weak';
  } else if (airQuality == 5){
    return 'poor';
  } else {
    return 'unknown'; 
  }
}
  
/**
 * Controls the visibility of stations on the map, due to the status of the checkboxes. 
 */
function filterFeatures() {
  
  // Get all keys that are checked 
  const checkboxes = document.querySelectorAll('.legendCheckbox');
  const visibleKeys = Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.id.replace('checkbox-', ''));

  // Control visibility
  vectorSource_air.getFeatures().forEach(feature => {
    const airQuality = feature.get('Luftqualitätsindex');
    var aqLevel = getAQKeyByLevel(airQuality);

    if (visibleKeys.includes(aqLevel)) {
      
      // Show feature
      feature.setStyle(null); //--------------------------------------> das hier versteh ich noch nicht so ganz--> schauste dir morgen nochmal an 
      console.log("selectedFeature: ", selectedFeature); 
      /*if(feature == selectedFeature) {
        feature.setStyle(pointStyleLarge(feature)); 
      } else {
        feature.setStyle(pointStyle(feature));
      }*/


    } else {
      
      // Hide feature
      feature.setStyle(new ol.style.Style({display: 'none'})); 
      if (selectedFeature && selectedFeature !== feature) // Checks if a feature is selected and it is not the currently processed feature
      {
        selectedFeature.setStyle(pointStyleLarge(selectedFeature)); 
      }
      if(selectedFeature === feature && document.getElementById("sidebar").style.width != "0") // Checks if the selected feature is the current feature and the sidebar is open 
      {
        selectedFeature = null;
        document.getElementById("sidebar").style.width = "0";
        document.getElementById("searchbar").classList.remove("left"); 
        
        // Hide popup if its open 
        var overlay = map.getOverlayById('popup_overlay');
        if (overlay) {
          overlay.setPosition(undefined);
        }
      }
    }
  });
}
