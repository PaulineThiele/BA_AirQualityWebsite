///////////////////////////////////////////
// creating air quality legend + filter 

create_AQ_Legend = function(colorList) {
    var air_legend = document.getElementById('air_legend');
    air_legend.innerHTML = '';
    var title = document.createElement("H4");
    title.id = "aqi_title"; 
    title.innerHTML = "Legend: Air Quality Index";
    air_legend.appendChild(title);
  
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
  
      air_legend.appendChild(legendContainer);
  
      checkbox.addEventListener('change', function() {
        filterFeatures();
      });
    }
    
    var infolinkdif = document.createElement("DIF"); 
    var infolink = document.createElement("A"); 

    infolinkdif.id = "link_legend"; 
    infolinkdif.innerHTML = "Link: "
    infolink.href = "https://www.umweltbundesamt.de/berechnungsgrundlagen-luftqualitaetsindex"; 
    infolink.innerHTML = "legend information"; 
    infolink.target = "_blank";
    infolinkdif.appendChild(infolink); 
    air_legend.appendChild(infolinkdif);
  }
  
  function getAQKeyByColor(airQuality) {
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
  
  // filter the points
  function filterFeatures() {
    const checkboxes = document.querySelectorAll('.legendCheckbox');
    const visibleKeys = Array.from(checkboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.id.replace('checkbox-', ''));
  
    vectorSource_air.getFeatures().forEach(feature => {
      const airQuality = feature.get('Luftqualitätindex');
      var aqLevel = getAQKeyByColor(airQuality);

      if (visibleKeys.includes(aqLevel)) {
        feature.setStyle(null); // Show feature
      } else {
        feature.setStyle(new ol.style.Style({display: 'none'})); // Hide feature
        if (selectedFeature && selectedFeature !== feature)
        {
          selectedFeature.setStyle(pointStyleLarge(selectedFeature)); 
          console.log("halöle"); 
        }
        if(selectedFeature === feature && document.getElementById("sidebar").style.width != "0") {
          selectedFeature = null;
          document.getElementById("sidebar").style.width = "0";
          document.getElementById("searchbar").classList.remove("left"); 
          
          // hide popup window if its open 
          var overlay = map.getOverlayById('popup_overlay');
          if (overlay) {
            overlay.setPosition(undefined);
          }
        }
      }
    });
  }