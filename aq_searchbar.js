//var searchResults = document.getElementById('list');
var liSelected;
var index = -1;

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
async function initSearch() {
  try {
    const geojsonData = await loadGEOJSON(); 
    console.log("data2: ", geojsonData); 

    // add eventlistener for searchbar 
    searchInput.addEventListener('input', function () {
      const query = this.value.toLowerCase();
      searchResults.innerHTML = ''; // delete old results

      if (query.length === 0) {
          return; 
      }

      console.log("data3: ", geojsonData); 
      console.log("data4: ", geojsonData.features); 

      // get visible categories from checkboxes 
      const checkboxes = document.querySelectorAll('.legendCheckbox');
      const visibleKeys = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.id.replace('checkbox-', ''));
      console.log("visibleKeys: ", visibleKeys); 

      // station filter: matching name + has do be visible 
      const filteredStations = geojsonData.features.filter(feature => {
        return feature.properties['Name']?.toLowerCase().includes(query);  
        //feature.properties['Name']?.toLowerCase().includes(query)
      });
      console.log("filteredStations: ", filteredStations); 
      const uniqueStations = [];
      const noStations = null;
      console.log("fS length: ", filteredStations.length); 

      if (filteredStations.length !== 0) 
      {
        filteredStations.forEach(feature => {
          const stationName = feature.properties['Name'];
          const featureTime = new Date(feature.properties.time);
        
          // Falls der Name noch nicht existiert oder der Eintrag neuer ist, aktualisieren && wenn AQI Index Kategorie sichtbar ist 
          if ((!uniqueStations[stationName] || featureTime > new Date(uniqueStations[stationName].properties.time))) {
            uniqueStations[stationName] = feature;
          }
        });
        console.log("uS: ", uniqueStations); 

        const realuniqueStations = {}; 
        uniqueStations.forEach(feature => {
          const stationName = feature.properties['Name']; 
          const airQuality = feature.properties['Luftqualitätindex'];
          const aqLevel = getAQKeyByColor(airQuality);
          console.log("visible AQ: ", airQuality, aqLevel); 
          if (visibleKeys.includes(aqLevel)){
            realuniqueStations[stationName] = feature; 
          }
        });
        console.log("ruS: ", realuniqueStations); 

        if(JSON.stringify(realuniqueStations) === "{}") {
          const li = document.createElement('li');
          li.textContent = "no visible station found with this name"; 
          searchResults.appendChild(li);
        }

        // show search resluts 
        Object.values(realuniqueStations).forEach(feature => {
          const li = document.createElement('li');
          li.textContent = feature.properties['Name'] || 'Unknown Station';
          li.dataset.feature = JSON.stringify(feature);

          // click on element
          li.addEventListener('click', () => {
              searchInput.value = feature.properties['Name'];
              searchResults.innerHTML = ''; // close dropdown 

              // open sidebar for station name 
              const olFeature = new ol.format.GeoJSON().readFeature(feature); // change feature (plain json) to olFeature (OpenLayers Object)
              console.log(olFeature); 
              console.log("selectedFeature: ", selectedFeature); 
              selectedFeature = olFeature; 
              //feature.setStyle(pointStyle(feature)); 
              //olFeature.setStyle(pointStyleLarge(olFeature)); // funktioniert nicht 
              openSidebar(olFeature);  
          });

          searchResults.appendChild(li);
        });
      }
      else {
        const li = document.createElement('li');
        li.textContent = "no visible station found with this name"; 
        searchResults.appendChild(li);
      }
  });
  } catch (error) {
    console.error("Fehler beim Laden der GeoJSON-Daten:", error);
  }
}

document.addEventListener('keydown', function(event) {
  var len = searchResults.getElementsByTagName('li').length - 1;
  if(searchResults.innerText !== "no station found with this name") {
    if (event.which === 40) {
      index++;
      //down 
      if (liSelected) {
        removeClass(liSelected, 'selected');
        next = searchResults.getElementsByTagName('li')[index];
        if (typeof next !== undefined && index <= len) {

          liSelected = next;
        } else {
          index = 0;
          liSelected = searchResults.getElementsByTagName('li')[0];
        }
        addClass(liSelected, 'selected');
        console.log(index);
      } else {
        index = 0;

        liSelected = searchResults.getElementsByTagName('li')[0];
        addClass(liSelected, 'selected');
      }
    } else if (event.which === 38) {

      //up
      if (liSelected) {
        removeClass(liSelected, 'selected');
        index--;
        console.log(index);
        next = searchResults.getElementsByTagName('li')[index];
        if (typeof next !== undefined && index >= 0) {
          liSelected = next;
        } else {
          index = len;
          liSelected = searchResults.getElementsByTagName('li')[len];
        }
        addClass(liSelected, 'selected');
      } else {
        index = 0;
        liSelected = searchResults.getElementsByTagName('li')[len];
        addClass(liSelected, 'selected');
      }
    } else if (event.which === 13) { // enter
      if (liSelected) {
          console.log("liSelected: ", liSelected); 
          var feature = JSON.parse(liSelected.dataset.feature);; 
          const olFeature = new ol.format.GeoJSON().readFeature(feature); 
          searchInput.value = feature.properties['Name'];
          searchResults.innerHTML = ''; // close dropdown 
          console.log("olFeature: ", olFeature); 
          //olFeature.setStyle(pointStyleLarge(olFeature)); // funktioniert nicht 
          selectedFeature = olFeature; 
          console.log(olFeature.getStyle()); 
          openSidebar(olFeature); 
      }
    }
  }
}, false);

function removeClass(el, className) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
};

function addClass(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ' ' + className;
  }
};