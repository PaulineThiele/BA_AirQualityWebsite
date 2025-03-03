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



/**
 * -- initial search function --
 * Filters the geojson file for the station name typed into the searchbar. 
 * Output: dropdown list 
 */ 

var liSelected,
    index = -1;

const searchbar = document.getElementById("searchbar");
const searchInput = document.getElementById('searchInput'), 
      searchResults = document.getElementById('searchResults');

// event listener for searchbar input field 
searchInput.addEventListener('input', function () {
  const query = this.value.toLowerCase();

  // Get all keys that are checked 
  const checkboxes = document.querySelectorAll('.legendCheckbox');
  const visibleKeys = Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.id.replace('checkbox-', ''));

  searchResults.innerHTML = '';
  let realuniqueStations = {};

  // iterate through each feature in layer 
  vectorSourceAir.getFeatures().forEach(olfeature => {
    
    // iterate through newest features
    newestFeatures.forEach(newfeature => {

      if(newfeature['id'] === olfeature.getId()) {
        
        const stationName = olfeature.getProperties()['Name']; 
        const airQuality = olfeature.getProperties()['Luftqualitätsindex'];
        const aqLevel = getAQKeyByLevel(airQuality);

        // check if feature is visible 
        if (visibleKeys.includes(aqLevel)){
          
          // check if input matches any visible station name 
          if(stationName.toLowerCase().includes(query))
            realuniqueStations[stationName] = newfeature; 
        }
      }
    });
  });


  if(!query) {
    // clear results if nothing is in input 
    searchResults.innerHTML = '';
  }
  else if(JSON.stringify(realuniqueStations) === "{}") {
    // return error message in dropdown list 
    errorSearchMessage(searchResults);
  }
  else {
    // show search resluts in dropdown list 
    Object.values(realuniqueStations).forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature.properties['Name'] || 'Unknown Station';
      li.dataset.feature = JSON.stringify(feature);

      // click on list element
      li.addEventListener('click', () => {
          searchResults.innerHTML = ''; // close dropdown 
          searchInput.value = ''; // empty input 

          // if selected feature exists, set default style 
          selectedFeature ? selectedFeature.setStyle(pointStyle(selectedFeature)): null;
          selectedFeature = null; 

          closeAllPopups(); // close all popups 

          // find feature on map with the clicked Id
          const olFeature = vectorSourceAir.getFeatures().find(f => 
            f.getId() === feature['id']
          );

          selectedFeature = olFeature; 

          openSidebar(selectedFeature);  
      });

      searchResults.appendChild(li);
    });
  }
});


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

        // if selected feature exists, set default style 
        selectedFeature ? selectedFeature.setStyle(pointStyle(selectedFeature)): null;
        selectedFeature = null; 

        const featureData = liSelected.getAttribute("data-feature");
        const featureObject = JSON.parse(featureData);

        // find feature on map with the entered Id
        const olFeature = vectorSourceAir.getFeatures().find(f => 
          f.getId() === featureObject.id
        );

        searchInput.value = olFeature.getProperties()['Name'];
        searchResults.innerHTML = ''; // close dropdown 
        searchInput.value = ''; // clear input field 

        closeAllPopups(); 

        selectedFeature = olFeature;  
        
        openSidebar(selectedFeature); 
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
