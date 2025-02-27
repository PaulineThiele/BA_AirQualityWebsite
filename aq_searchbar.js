/**
 * ------ Air Quality Search Bar ------
 * 
 * Placed at the top center of the website.
 * 
 * Is able to search for station names that exist and are visible (checked in the legend).
 * Shows search results in a dropdown list below the searchbar. 
 * 
 * Author: Pauline Thiele 
 */


var liSelected,
    index = -1;

const searchInput = document.getElementById('searchInput'), 
      searchResults = document.getElementById('searchResults');

/**
 * -- initial search function --
 * Filters the geojson file for the station name typed into the searchbar. 
 * Output: dropdown list 
 */      
async function initSearch() {
  try {
    const geojsonData = await loadGEOJSON(); 

    // add eventlistener for searchbar 
    searchInput.addEventListener('input', function () {
      const query = this.value.toLowerCase();
      searchResults.innerHTML = ''; // delete old results

      if (query.length === 0) {
        return; 
      }

      // station filter: get all visible categories from legend checkboxes 
      const checkboxes = document.querySelectorAll('.legendCheckbox');
      const visibleKeys = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.id.replace('checkbox-', '')); 
      //console.log("visible keys: ", visibleKeys);

      // station filter: get all station entries with matching name 
      const filteredStations = geojsonData.features.filter(feature => {
        return feature.properties['Name']?.toLowerCase().includes(query);  
      });
      //console.log("filteredStations: ", filteredStations);

      const uniqueStations = [];

      if (filteredStations.length !== 0) 
      {
        // filter stations: get only each newest station entry 
        filteredStations.forEach(feature => {
          const stationName = feature.properties['Name'];
          const featureTime = new Date(feature.properties.time);
        
          if ((!uniqueStations[stationName] || featureTime > new Date(uniqueStations[stationName].properties.time))) {
            uniqueStations[stationName] = feature;
          }
        });
        //console.log("uniqueStations: ", uniqueStations); 

        const realuniqueStations = {}; 

        // filter stations: from the newest station entries get only the ones that are visible 
        uniqueStations.forEach(feature => {
          const stationName = feature.properties['Name']; 
          const airQuality = feature.properties['Luftqualitätsindex'];
          const aqLevel = getAQKeyByLevel(airQuality);

          if (visibleKeys.includes(aqLevel)){
            realuniqueStations[stationName] = feature; 
          }
        });
        //console.log("realuniqueStations: ", realuniqueStations); 

        // return error message in dropdown list 
        if(JSON.stringify(realuniqueStations) === "{}") {
          errorSearchMessage(searchResults);
        }

        // show search resluts in dropdown list 
        Object.values(realuniqueStations).forEach(feature => {
          const li = document.createElement('li');
          li.textContent = feature.properties['Name'] || 'Unknown Station';
          li.dataset.feature = JSON.stringify(feature);

          // click on list element
          li.addEventListener('click', () => {
              searchInput.value = feature.properties['Name'];
              searchResults.innerHTML = ''; // close dropdown 

              // open sidebar for station name 
              closeAllPopups(); // close all popups 

              // change feature (plain json) to olFeature (OpenLayers Object)
              const olFeature = new ol.format.GeoJSON().readFeature(feature); 
              //console.log("olFeature: ", olFeature); 
              
              selectedFeature = olFeature; 
              //console.log("selectedFeature2: ", selectedFeature); 
              selectedFeature.setStyle(pointStyleLarge(selectedFeature));
              //olFeature.setStyle(pointStyleLarge(olFeature));
              //feature.setStyle(pointStyle(feature)); 
              //olFeature.setStyle(pointStyleLarge(olFeature)); // funktioniert nicht 

              
              openSidebar(olFeature);  
          });

          searchResults.appendChild(li);
        });
      }
      else {
        errorSearchMessage(searchResults); 
      }
  });
  } catch (error) {
    console.error("Fehler beim Laden der GeoJSON-Daten:", error);
  }
}

/**
 * Shows error message if no visible station was foound. 
 * @param {ul} searchResults 
 */
function errorSearchMessage(searchResults) {
  const li = document.createElement('li');
  li.textContent = "No visible station found with this name"; 
  li.style.backgroundColor = "rgb(240, 128, 128)"; 
  li.style.color = "rgb(0, 0, 0)"; 
  li.style.border = "2px solid rgb(139, 0, 0)"; 
  li.style.padding = "5px"; 
  li.style.borderRadius = "5px";
  li.style.marginTop = "5px"; 
  searchResults.appendChild(li);
}

/**
 * Closes all open Popups. 
 */
function closeAllPopups() {
  const overlays = map.getOverlays().getArray();
  overlays.forEach(overlay => overlay.setPosition(undefined));
  selectedFeature = null;
}

/**
 * Eventlisteners for keydown events: down arrow key, up arrow key, enter key 
 */
document.addEventListener('keydown', function(event) {
  var len = searchResults.getElementsByTagName('li').length - 1;
  if(searchResults.innerText !== "no station found with this name") {
    
    // down arrow key
    if (event.which === 40) {
      index++;
      
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
        //console.log(index);
      } else {
        index = 0;
        liSelected = searchResults.getElementsByTagName('li')[0];
        addClass(liSelected, 'selected');
      }
    } 
    //up arrow key 
    else if (event.which === 38) {

      if (liSelected) {
        removeClass(liSelected, 'selected');
        index--;
        //console.log(index);
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
    } 
    // enter key 
    else if (event.which === 13) { 
      
      if (liSelected) {
        console.log("liSelected: ", liSelected); 
        var feature = JSON.parse(liSelected.dataset.feature);; 
        const olFeature = new ol.format.GeoJSON().readFeature(feature); 
        searchInput.value = feature.properties['Name'];
        searchResults.innerHTML = ''; // close dropdown 
        console.log("olFeature: ", olFeature); 
        //olFeature.setStyle(pointStyleLarge(olFeature)); // funktioniert nicht 
        selectedFeature = olFeature; 
        selectedFeature.setStyle(pointStyleLarge(selectedFeature));
        //olFeature.setStyle(pointStyleLarge(olFeature));
        console.log("selectedFeature bei Enter: ", selectedFeature.getStyle()); 
        closeAllPopups(); 
        openSidebar(olFeature); 
      }
    }
  }
}, false);

/**
 * Removes a specified class from an element.
 * @param {li} el 
 * @param {string} className 
 */
function removeClass(el, className) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
};

/**
 * Adds a specified class to an element.
 * @param {li} el 
 * @param {string} className 
 */
function addClass(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ' ' + className;
  }
};


// Event listener for closing the result dropdown, when clicked somewhere else on the screen. 
document.addEventListener('click', (event) => {
  if (!document.getElementById('searchbar').contains(event.target)) {
    searchResults.innerHTML = '';
  }
});