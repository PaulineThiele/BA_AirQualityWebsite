/**
 * ------ Air Quality Sidebar ------
 * 
 * Placed at the right side of the screen. 
 * 
 * Shows the measured air values for a specific station, including historical data in a diagram 
 * and download options. 
 * 
 * Author: Pauline Thiele 
 */


let myChart;
var dates = []; 
var pm25DataSD = []; 
var pm10DataSD = []; 
var pm25DataHM = []; 
var pm10DataHM = [];
var no2Data = []; 
var coData = []; 
let timeFilteredStations = [];


/**
 * Creates the content of the sidebar. 
 * @param {object} feature 
 */
function ContentSidebar(feature) {
 
  var properties = feature.getProperties();
  let insertedContent = document.querySelectorAll(".insertedSidebarContent");

  // removes old content
  if(insertedContent.length > 0) {
    for (var i = 0; i < insertedContent.length; i++)  insertedContent[i].remove();
  }

  const headerSidebar = document.getElementById('headerSidebar'),
        locationSidebar = document.getElementById('locationSidebar'),
        aqvSidebar = document.getElementById('aqvSidebar'),
        airDataSidebar = document.getElementById('airDataSidebar'),
        chartSidebar = document.getElementById('chart');
  
  let html = `  <h1 class="indent_h insertedSidebarContent" id="headerStation">Station ${properties['Name'] || 'Unknown'}</h1>
                <p id="indentlastupdate_sidebar" class="insertedSidebarContent">Last Update at: ${properties['time'] || 'Unknown'}</p>`;
  headerSidebar.insertAdjacentHTML("beforeend", html);

  html = `  <p class="insertedSidebarContent">UTM-Nord [m]: ${properties['UTM-Nord [m]'] || 'Unknown'}</p>
            <p class="insertedSidebarContent">UTM-East [m]: ${properties['UTM-Ost [m]'] || 'Unknown'}</p>
            <p class="insertedSidebarContent">NHN Height [m]: ${properties['NHN Höhe [m]'] || 'Unknown'}</p>`;
  locationSidebar.insertAdjacentHTML("beforeend", html);

  html = `  <p id="airQualityIndex" class="insertedSidebarContent">Air Quality Index: </p>
            <p class="insertedSidebarContent">PM<sub>2,5</sub> [µg/m<sup>3</sup>]: </p>
            <p class="indent insertedSidebarContent" id=PM2_5_SD>Sensor SDS011: ${properties['SD:PM2_5'] || 'Unknown'}</p>
            <p class="indent insertedSidebarContent" id=PM2_5_HM>Sensor HM3301: ${properties['SD:PM10'] || 'Unknown'}</p>
            <p class="insertedSidebarContent">PM<sub>10</sub> [µg/m<sup>3</sup>]: </p>
            <p class="indent insertedSidebarContent" id=PM10_SD>Sensor SDS011: ${properties['GM:PM2_5_Atm'] || 'Unknown'}</p>
            <p class="indent insertedSidebarContent" id=PM10_HM>Sensor HM3301: ${properties['GM:PM10_Atm'] || 'Unknown'}</p>
            <p id=NO2 class="insertedSidebarContent">NO<sub>2</sub> [µg/m<sup>3</sup>]: </p>
            <p class="indent insertedSidebarContent" id=NO2_MG>Sensor Grove - Mehrkanal-Gassensor V2: ${properties['NO2'] || 'Unknown'}</p>
            <p id=CO class="insertedSidebarContent">CO [mg/m<sup>3</sup>]: </p>
            <p class="indent insertedSidebarContent" id=CO_MG>Sensor Grove - Mehrkanal-Gassensor V2: ${properties['CO'] || 'Unknown'}</p>`;
  aqvSidebar.insertAdjacentHTML("beforeend", html);

  html = `  <p class="insertedSidebarContent">Temperature [°C]: ${properties['Temperatur [°C]'] || 'Unknown'}</p>
            <p class="insertedSidebarContent">Humidity [%]: ${properties['Luftfeuchte [%]'] || 'Unknown'}</p>
            <p class="insertedSidebarContent">Pressure [hPa]: ${properties['Luftdruck [hPa]'] || 'Unknown'}</p>`;
  airDataSidebar.insertAdjacentHTML("beforeend", html);

  html = '<canvas id="myChart" class="insertedSidebarContent"></canvas>';
  chartSidebar.insertAdjacentHTML("afterbegin", html); 


  window.closeSidebarHelper = function() {
      closeSidebar(feature);
  };

  window.updateChartHelper = function(checkbox) {
    updateChart(checkbox.value); 
  }

  window.updateAllHelper = function(checkbox){
    updateAll(checkbox); 
  }

  window.filterDataHelper = function() {
    filterData(); 
  }

  window.downloadAsPNGHelper = function() {
    downloadAsPNG(); 
  }

  window.downloadAsJSONHelper = function() {
    downloadAsJSON(); 
  }
}


/**
 * Transform coordinates into EPSG:3857 format (pseudo-mercator) that is used by OSM 
 * @param {object} coordinate 
 * @returns {object} 
 */
function transformCoordinates(coordinate) {

  if (Math.abs(coordinate[0]) <= 180 && Math.abs(coordinate[1]) <= 90) {
    coordinate = ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:3857');
    console.log("coordinates transformed to EPSG:3857:", coordinate);
  } else {
    console.log("coordinates already in EPSG:3857:", coordinate);
  }
  return coordinate; 
}


/**
 * Centers the station point on the left half aof the screen. 
 * @param {object} view 
 * @param {object} coordinate 
 */
function centerPointOnTheLeft (view, coordinate) {

  // Calculate the current map extent and its width to determine the visible area.
  var extent = view.calculateExtent(map.getSize());
  var mapWidth = extent[2] - extent[0];

  // Move map by 1/4 of calculated map width. 
  var offsetX = mapWidth / 4; 
  var centerWithOffset = [coordinate[0] + offsetX, coordinate[1]];

  view.animate({
    center: centerWithOffset,
    duration: 800, 
    easing: ol.easing.easeOut
  });
}


/**
 * Move and zoom in on the map to display the station point on the left half of the screen. 
 * @param {object} feature 
 */
function zoomToFeatureOnLeftSide(feature) {

  // Transform coordinates into correct format. 
  var coordinate = feature.getGeometry().getCoordinates();
  coordinate = transformCoordinates(coordinate); 

  var view = map.getView();
  var targetZoomLevel = 16;
  let currentZoom = view.getZoom();

  // Zoom into and center the station point on the left side of the screen. 
  if(currentZoom < targetZoomLevel) {
    view.animate({
      center: coordinate,
      zoom: targetZoomLevel,
      duration: 800,
      easing: ol.easing.easeOut
    },
    function() {
      centerPointOnTheLeft(view, coordinate);
    });
  } else {
    centerPointOnTheLeft(view, coordinate);
  } 
}


/**
 * Creates an AQ div with the associated index color and the index key word. 
 * @param {number} level 
 * @returns {object}
 */
function createColoredAqDiv(level) {
  var aqDiv = document.createElement("DIV");
  aqDiv.className = "aq_div insertedSidebarAQContent";

  let text = getAQKeyByLevel(level),
      html = `<p id="textcolor" >${text}</p>`; 
  aqDiv.insertAdjacentHTML("beforeend", html);
  
  if(level === 5 || level === undefined) {
    aqDiv.style.color = "white";
  }

  aqDiv.style.backgroundColor = getColorByAirQuality(level);
  return aqDiv;
}

/**
 * Creates chart with Chart.js. 
 * @param {object} latestFeatures 
 */
function createChart(latestFeatures){

  dates = latestFeatures.map(feature => feature.properties.time); // time stamp for x-axis 
  pm25DataSD = latestFeatures.map(feature => feature.properties["SD:PM2_5"]);
  pm10DataSD = latestFeatures.map(feature => feature.properties["SD:PM10"]);
  pm25DataHM = latestFeatures.map(feature => feature.properties["GM:PM2_5_Atm"]); 
  pm10DataHM = latestFeatures.map(feature => feature.properties["GM:PM10_Atm"]);
  no2Data = latestFeatures.map(feature => feature.properties["NO2"]);
  coData = latestFeatures.map(feature => feature.properties["CO"] * 1000); // calculation from mg/m3 to μg/m³ 

  var ctx = document.getElementById("myChart"); 

  myChart = new Chart(ctx, {
    type: 'line', 
    data: {
      labels: dates.reverse(), 
      datasets: [
        {
          label: 'PM2.5 SDS011',
          data: pm25DataSD.reverse(),
          borderColor: 'rgb(156, 137, 178)',
          backgroundColor: 'rgba(156, 137, 178, 0.4)',
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'PM10 SDS011',
          data: pm10DataSD.reverse(),
          borderColor: 'rgb(110, 41, 124)',
          backgroundColor: 'rgba(110, 41, 124, 0.4)',
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'PM2.5 HM3301',
          data: pm25DataHM.reverse(),
          borderColor: 'rgb(245, 175, 2)',
          backgroundColor: 'rgba(245, 175, 2, 0.4)',
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'PM10 HM3301',
          data: pm10DataHM.reverse(),
          borderColor: 'rgb(243, 130, 50)',
          backgroundColor: 'rgba(243, 130, 50, 0.4)',
          tension: 0.1,
          pointRadius: 0,
        }, 
        {
          label: 'NO2 G-Mehrkanal-Gassensor V2',
          data: no2Data.reverse(),
          borderColor: 'rgb(57, 119, 253)',
          backgroundColor: 'rgba(57, 119, 253, 0.4)',
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'CO G-Mehrkanal-Gassensor V2',
          data: coData.reverse(),
          borderColor: 'rgb(57, 240, 253)',
          backgroundColor: 'rgba(57, 240, 253, 0.4)',
          tension: 0.1,
          pointRadius: 0,
        },
      ]
    },
    options: {
      scales: {
        x: {
          display: true,
          title: {
              display: true,
              text: 'Time'
          }
        },
        y: {
          display: true,
          title: {
              display: true,
              text: 'Concentration (μg/m³)'
          }
        }
      }, 
      plugins: {
        legend: {
          display: false
        }
      },
      maintainAspectRatio: false
    }
  }); 

  // adding sqaures with color of graph to the legend
  if (window.myChart) {
    const datasets = myChart.data.datasets;
    const checkboxes = document.querySelectorAll('.datacheckbox');

    checkboxes.forEach((checkbox, index) => {
      const colorBox = document.createElement('span');
      //colorBox.classList.add('color-box');
      colorBox.className = "color-box insertedSidebarContent"; 

      // read colors from myChart dtasets
      colorBox.style.backgroundColor = datasets[index]?.backgroundColor || '#000';
      colorBox.style.borderColor = datasets[index]?.borderColor || '#000'; 

      // add colorful span behind checkbox
      checkbox.parentNode.insertBefore(colorBox, checkbox.nextSibling);
    });
  }

  // ckeck all checkboxes by default when opening the sidebar 
  setTimeout(() => {
    if (!myChart) return; 

    const checkboxes = document.querySelectorAll('.datacheckbox');
    document.getElementById("selectallcheckbox").checked = true; 
    checkboxes.forEach((checkbox, index) => {
        if (myChart.data.datasets[index]) {
            checkbox.checked = true;
            myChart.show(index);
        }
    });
  }, 100); // minimal delay
}



/**
 * Opens Sidebar for associated station and shows the content. 
 * @param {object} feature 
 */
function openSidebar(feature) {

  feature.setStyle(pointStyleLarge(feature));
  //map.render(); 

  // Zoom into map and center the station point on the left half of the screen.  
  zoomToFeatureOnLeftSide(feature); 

  // Makes the close button visible. 
  document.getElementById("sidebar").classList.add("open");

  // Move the searchbar to the left. 
  document.getElementById("searchbar").classList.add("left"); 
  
  // Creates visible content. 
  ContentSidebar(feature); 

  document.getElementById("sidebar").style.width = "50%";
  document.getElementById("map").style.marginRight = "50%";
  document.getElementById("error_chart").style.visibility = "hidden"; 
  document.getElementById("error_time").style.visibility = "hidden"; 
  document.getElementById("error_time_1h").style.visibility = "hidden"; 
  document.getElementById("error_buttons").style.visibility = "hidden"; 


  var properties = feature.getProperties(), 
      circleAqIndex = createColoredAqDiv(properties['Luftqualitätsindex']), 
      parameterIndex = properties['Parameterindex']; 

  var airQualityIndexElement = document.getElementById("airQualityIndex"), 
      PM2_5_SD_Element = document.getElementById("PM2_5_SD"),
      PM2_5_HM_Element = document.getElementById("PM2_5_HM"),
      PM10_SD_Element = document.getElementById("PM10_SD"),
      PM10_HM_Element = document.getElementById("PM10_HM"),
      NO2_Element = document.getElementById("NO2_MG"),
      CO_Element = document.getElementById("CO_MG");

  // If there is an air quality index element, remove all contents with the class "insertedSidebarAQContent" and add new contents. 
  if(airQualityIndexElement) { 
    let insertedContent = document.querySelectorAll(".insertedSidebarAQContent");
    if(insertedContent.length > 0) {
      for (var i = 0; i < insertedContent.length; i++)  insertedContent[i].remove();
    }

    airQualityIndexElement.insertBefore(circleAqIndex, airQualityIndexElement.children[0]);
    PM2_5_SD_Element.insertBefore(createColoredAqDiv(parameterIndex['pm2_5_SD']), PM2_5_SD_Element.children[0]); 
    PM2_5_HM_Element.insertBefore(createColoredAqDiv(parameterIndex['pm2_5_HM']), PM2_5_HM_Element.children[0]); 
    PM10_SD_Element.insertBefore(createColoredAqDiv(parameterIndex['pm10_SD']), PM10_SD_Element.children[0]); 
    PM10_HM_Element.insertBefore(createColoredAqDiv(parameterIndex['pm10_HM']), PM10_HM_Element.children[0]); 
    NO2_Element.insertBefore(createColoredAqDiv(parameterIndex['no2']), NO2_Element.children[0]); 
    CO_Element.insertBefore(createColoredAqDiv(parameterIndex['co']), CO_Element.children[0]); 
  }


  // Fetch data from the geojson file, to 
  fetch(dataFile)
  .then(function(response){
    return response.json(); 
  })
  .then(function(data){    

    // filter features by station name 
    const nameFilteredStations = data.features.filter(f => 
      f.properties['Name'] === feature.getProperties()['Name']
   );
 
    // filter features from each station name by date
    timeFilteredStations = nameFilteredStations.sort(function(a, b) {
    return new Date(b.properties.time) - new Date(a.properties.time);});

    // get min and max values for creating time period of the chart 
    var minDate = new Date(timeFilteredStations[timeFilteredStations.length - 1].properties.time);
    var maxDate = new Date(timeFilteredStations[0].properties.time);

    // calculate timezone offset (1h)
    var x = (new Date()).getTimezoneOffset() * 60000;
    
    // set min and max values for time period input fields
    document.getElementById('startdate').min = (new Date(minDate-x)).toISOString().slice(0, 16);
    document.getElementById('startdate').max = (new Date(maxDate-x)).toISOString().slice(0, 16);
    document.getElementById('enddate').min = (new Date(minDate-x)).toISOString().slice(0, 16);
    document.getElementById('enddate').max = (new Date(maxDate-x)).toISOString().slice(0, 16);

  
    // set min and max values for chart
    if(maxDate - (24 * 60 * 60 * 1000) >= minDate) {
      // default: show last 24 h of measurement in the chart
      var defaultStartDate = (new Date(maxDate - 24 * 60 * 60 * 1000-x)).toISOString().slice(0, 16);
    }
    else {
      // if measurement period is smaller than 24 h, show the whole period 
      var defaultStartDate = (new Date(minDate-x)).toISOString().slice(0, 16); 
    }
    var defaultEndDate = (new Date(maxDate-x)).toISOString().slice(0, 16);
    //console.log("defaultStartDate: ", defaultStartDate); 
    //console.log("defaultEndDate: ", defaultEndDate); 

    document.getElementById('startdate').value = defaultStartDate;
    document.getElementById('enddate').value = defaultEndDate;

    // filters features, that are in default time period
    var filteredFeatures = timeFilteredStations.filter(function(feature) {
      var featureDate = new Date(feature.properties.time);
      return featureDate >= new Date(defaultStartDate) && featureDate <= new Date(defaultEndDate);
    });

    // Diagramm mit den gefilterten Daten erstellen
    createChart(filteredFeatures);
  })

  //console.log("sidebarPointStyle3: ", feature.getStyle()); 
  //feature.setStyle(pointStyleLarge(feature));
  selectedFeature = feature;
  selectedFeature.setStyle(pointStyleLarge(selectedFeature)); 
  map.render(); 
  console.log("der Style: ", selectedFeature.getStyle());
  //console.log("Feature Layer:", map.getLayers());
}


/**
 * Updates all checkboxes when checkbox "Select all" has changed 
 * @param {object} selectall 
 */
function updateAll(selectall) {
  let checkboxes = document.querySelectorAll('.datacheckbox'); 

  if(selectall.checked === false) {
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = false; 
      myChart.hide(i);
    }
  }
  else {
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = true;
      myChart.show(i); 
    }
  }
}; 


/**
 * Updates the checkbox "Select All" after an other checkbox was clicked
 */
function checkboxSelectAllChecker() {
  let selectallcheckbox = document.getElementById("selectallcheckbox"); 
  let checkboxes = document.querySelectorAll('.datacheckbox'); 

  let x = 0; 
  for(let i = 0; i <= checkboxes.length - 1; i++) {
    if(checkboxes[i].checked === true) {
      x++; 
    }
  }; 

  if(x == checkboxes.length){
    selectallcheckbox.checked = true; 
  } else {
    selectallcheckbox.checked = false; 
  }
}; 


/**
 * Updates chart after a checkbox was clicked 
 * @param {string} dataset 
 */
function updateChart(dataset) {
  const isDataShown = myChart.isDatasetVisible(dataset);  

  if (isDataShown === false) {
    myChart.show(dataset);  // show the dataset
  } else {
    myChart.hide(dataset);  // hide dataset
  }
  checkboxSelectAllChecker(); 
}; 


/**
 * Filters the diagram based on the inputs of start and end date from the user. 
 * Manages the error messages for the input fields. 
 */
function filterData() {
  // get current start and end date 
  var startDate = new Date(document.getElementById('startdate').value),
      endDate = new Date(document.getElementById('enddate').value);

  // get error messages 
  const error_chart = document.getElementById('error_chart'),
        error_time = document.getElementById('error_time'),
        error_time_1h = document.getElementById('error_time_1h'),
        error_buttons = document.getElementById('error_buttons');

  // calculate start date + 1 h, because the measurements are hourly       
  var startDatePlusOneHour = new Date(startDate.getTime() + (60 * 60 * 1000));

  // error message manager 
  if(startDate >= endDate) {
    // shows "The end time must be greater than the start time."
    error_chart.style.visibility = "visible";
    error_time.style.visibility = "visible"; 
    error_time_1h.style.visibility = "hidden"; 
  } else if (startDatePlusOneHour > endDate) {
    // shows "Between the start and end time must be 1 hour."
    error_chart.style.visibility = "visible"; 
    error_time.style.visibility = "hidden"; 
    error_time_1h.style.visibility = "visible";
  } else {
    // input is correct, shows no error message
    error_chart.style.visibility = "hidden"; 
    error_time.style.visibility = "hidden"; 
    error_time_1h.style.visibility = "hidden";
    error_buttons.style.visibility = "hidden"; 

    // get features that are in the specific time stamp
    const filteredFeatures = timeFilteredStations.filter(feature => {
      const featureDate = new Date(feature.properties.time);
      return featureDate >= startDate && featureDate <= endDate;
    });

    // extract data for chart
    const filteredDates = filteredFeatures.map(f => f.properties.time);
    const filteredPM25SD = filteredFeatures.map(f => f.properties["SD:PM2_5"]);
    const filteredPM10SD = filteredFeatures.map(f => f.properties["SD:PM10"]);
    const filteredPM25HM = filteredFeatures.map(f => f.properties["GM:PM2_5_Atm"]);
    const filteredPM10HM = filteredFeatures.map(f => f.properties["GM:PM10_Atm"]);
    const filteredNO2 = filteredFeatures.map(f => f.properties["NO2"]);
    const filteredCO = filteredFeatures.map(f => f.properties["CO"]);

    // refresh diagramm with data shown in correct time order
    myChart.data.labels = filteredDates.reverse();
    myChart.data.datasets[0].data = filteredPM25SD.reverse();
    myChart.data.datasets[1].data = filteredPM10SD.reverse();
    myChart.data.datasets[2].data = filteredPM25HM.reverse();
    myChart.data.datasets[3].data = filteredPM10HM.reverse();
    myChart.data.datasets[4].data = filteredNO2.reverse();
    myChart.data.datasets[5].data = filteredCO.reverse();

    myChart.update(); 
  }
}


/**
 * Downloads the visible diagram as PNG file. 
 */
function downloadAsPNG() {
  const errorChart = document.getElementById('error_chart'); 
  const errorButtons = document.getElementById('error_buttons'); 

  if(errorChart.style.visibility == "visible") {
    // shows "Download not possible. Please handle the other error befor starting the download."
    errorButtons.style.visibility = "visible"; 
  } else {
    // download is possible 
    errorButtons.style.visibility = "hidden"; 

    const canvas = document.getElementById("myChart");

    // draw diagramm
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width + 40;
    tempCanvas.height = canvas.height + 180;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.fillStyle = "white"; // white background
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 20, 20);

    // get only visible graphs for legend
    const checkboxes = document.querySelectorAll(".datacheckbox");
    const datasets = myChart.data.datasets;
    const activeDatasets = [];

    checkboxes.forEach((checkbox, index) => {
      if (checkbox.checked) {
        activeDatasets.push({ label: datasets[index].label, color: datasets[index].borderColor });
      }
    });

    // set legend position and style 
    const legendX = 30;
    const legendY = canvas.height + 20;
    const boxSize = 12;
    tempCtx.font = "14px Arial";
    tempCtx.fillStyle = "black";

    // draw legend 
    activeDatasets.forEach((dataset, index) => {
      const textY = legendY + index * 25;

      // draw colorbox
      tempCtx.fillStyle = dataset.color;
      tempCtx.fillRect(legendX, textY, boxSize, boxSize);

      // draw label
      tempCtx.fillStyle = "black";
      tempCtx.fillText(dataset.label, legendX + 20, textY + 10);
    });
    
    // create PNG file 
    const imageLink = document.createElement("A"); 
    imageLink.download = "diagram.png"; 
    imageLink.href = tempCanvas.toDataURL('image/png', 1); 
    imageLink.click(); 
  }
}


/**
 * Downloads visible diagram data as json file. 
 */
function downloadAsJSON() {  
  const error_chart = document.getElementById('error_chart'); 
  const error_buttons = document.getElementById('error_buttons'); 

  if(error_chart.style.visibility == "visible") {
    // shows "Download not possible. Please handle the other error befor starting the download."
    error_buttons.style.visibility = "visible"; 
  } else {
    // download is possible
    error_buttons.style.visibility = "hidden"; 

    // get diagram data 
    const data = {
      labels: myChart.data.labels, // time stamp 
      datasets: myChart.data.datasets
      .filter((dataset, index) => myChart.isDatasetVisible(index)) // only get visible datasets 
      .map(dataset => ({
        label: dataset.label,
        data: dataset.data
      }))
    };

    // puts diagram data into json format 
    const jsonFormat = data.labels.map((label, index) => {
      const entry = { timestamp: label };
      data.datasets.forEach(dataset => {
        entry[dataset.label] = dataset.data[index];
      });
      return entry;
    });

    const jsonString = jsonFormat.map(item => JSON.stringify(item)).join('\n'); // formats data for better readability
    
    // creates json file 
    const blob = new Blob([jsonString], { type: "application/json" }), 
          url = URL.createObjectURL(blob), 
          link = document.createElement("a"); 
    link.href = url;
    link.download = "air_quality_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
  

/**
 * Calculate the sidebar width in map units.
 * @returns {number}
 */
function calculateWidth() {
  var mapWidth = map.getSize()[0];
  var sidebarWidth = mapWidth * 0.5;
  var resolution = map.getView().getResolution();
  var sidebarWidthInMapUnits = sidebarWidth * resolution;
  return sidebarWidthInMapUnits;
}

/**
 * Close sidebar, including position reset of station on the map. 
 * @param {object} feature 
 */
function closeSidebar(feature) {  
  document.getElementById("sidebar").style.width = "0";
  document.getElementById("map").style.marginRight = "0";

  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';

  // transform coordinates if needed
  var coordinate = feature.getGeometry().getCoordinates();
  coordinate = transformCoordinates(coordinate); 

  // reset position to screen center 
  var sidebarWidthInMapUnits = calculateWidth();
  var newCenter = [coordinate[0] - sidebarWidthInMapUnits/16, coordinate[1]];
  map.getView().animate({ center: newCenter, duration: 500 });

  // reset point size 
  if (selectedFeature) {
    selectedFeature.setStyle(pointStyle(selectedFeature));
    selectedFeature = null;
  }

  // hide close button 
  document.getElementById("sidebar").classList.remove("open");

  // move searchbar back to the middle 
  document.getElementById("searchbar").classList.remove("left"); 
}
  