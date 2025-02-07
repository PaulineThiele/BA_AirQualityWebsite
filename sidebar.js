///////////////////////////////////////////
// sidebar functions
let myChart;

function ContentSidebar(feature) {
  var properties = feature.getProperties();
  
  var content = `
    <a href="javascript:void(0)" class="closebtn" id="sidebar_closer" onclick="closeSidebarHelper()">&times;</a>
    <h2 class="indent_h" id="headerStation">Station ${properties['Name'] || 'Unknown'}</h2>
    <p id="indentlastupdate_sidebar">Last Update at: ${properties['time'] || 'Unknown'}</p>
    <h4 class="indent_h">Location: </h4>
    <div class="indent">
      <p>UTM-Nord [m]: ${properties['UTM-Nord [m]'] || 'Unknown'}</p>
      <p>UTM-East [m]: ${properties['UTM-Ost [m]'] || 'Unknown'}</p>
      <p>NHN Height [m]: ${properties['NHN Höhe [m]'] || 'Unknown'}</p>
    </div>
    <hr class="hr_sb">
    <h4 class="indent_h">Air quality values:</h4>
    <div class="indent">
      <p id="airQualityIndex">Air Quality Index: ${properties['Luftqualitätindex'] || 'Unknown'}</p>
      <p>PM<sub>2,5</sub> [µg/m<sup>3</sup>]: </p>
      <p class="indent" id=PM2_5_SD>Sensor SDS011: ${properties['SD:PM2_5'] || 'Unknown'}</p>
      <p class="indent" id=PM2_5_HM>Sensor HM3301: ${properties['SD:PM10'] || 'Unknown'}</p>
      <p>PM<sub>10</sub> [µg/m<sup>3</sup>]: </p>
      <p class="indent" id=PM10_SD>Sensor SDS011: ${properties['GM:PM2_5_Atm'] || 'Unknown'}</p>
      <p class="indent" id=PM10_HM>Sensor HM3301: ${properties['GM:PM10_Atm'] || 'Unknown'}</p>
      <p id=NO2>NO<sub>2</sub> [µg/m<sup>3</sup>]: </p>
      <p class="indent" id=NO2_MG>Sensor Grove - Mehrkanal-Gassensor V2: ${properties['NO2'] || 'Unknown'}</p>
      <p id=CO>CO [mg/m<sup>3</sup>]: </p>
      <p class="indent" id=CO_MG>Sensor Grove - Mehrkanal-Gassensor V2: ${properties['CO'] || 'Unknown'}</p>
    </div>
    <hr class="hr_sb">
    <h4 class="indent_h">Air Data:</h4>
    <div class="indent">
      <p>Temperature [°C]: ${properties['Temperatur [°C]'] || 'Unknown'}</p>
      <p>Humidity [%]: ${properties['Luftfeuchte [%]'] || 'Unknown'}</p>
      <p>Pressure [hPa]: ${properties['Luftdruck [hPa]'] || 'Unknown'}</p>
    </div>
    <hr class="hr_sb">
    <h4 class="indent_h">Historical Air Quality Data: </h4>
    <div class="chart">
      <canvas id="myChart"></canvas> <br>
      <label id="l_startdate">Start date: </label>
      <input onchange="filterDataHelper()" type="datetime-local" id="startdate" value="">
      <label id="l_enddate">End date: </label>
      <input onchange="filterDataHelper()" type="datetime-local" id="enddate" value=""> 
    </div>
    <hr class="hr_sb">
    <div id="chartlegend">
      <input id="selectallcheckbox" type="checkbox" onclick="updateAllHelper(this)" checked="">Select all <br>
      <input class="datacheckbox" type="checkbox" onclick="updateChartHelper(this)" checked="" value="0"> PM<sub>2,5</sub> Sensor: SDS011 <br>
      <input class="datacheckbox" type="checkbox" onclick="updateChartHelper(this)" checked="" value="1"> PM<sub>10</sub> Sensor: SDS011 <br>
      <input class="datacheckbox" type="checkbox" onclick="updateChartHelper(this)" checked="" value="2"> PM<sub>2,5</sub> Sensor: HM3301 <br>
      <input class="datacheckbox" type="checkbox" onclick="updateChartHelper(this)" checked="" value="3"> PM<sub>10</sub> Sensor: HM3301 <br>
      <input class="datacheckbox" type="checkbox" onclick="updateChartHelper(this)" checked="" value="4"> NO<sub>2</sub> Sensor: G-Mehkanal-Gassensor V2 <br> 
      <input class="datacheckbox" type="checkbox" onclick="updateChartHelper(this)" checked="" value="5"> CO Sensor: G-Mehkanal-Gassensor V2 
    </div> 
    <hr class="hr_sb"> 
    <div id="download">
      <button class="buttons" id="PNGDownload" onclick="downloadAsPNGHelper()">Download diagram as png</button>
      <button class="buttons" id="JSONDownload" onclick="downloadAsJSONHelper()">Download diagram data as json</button> <br><br> 
    </div>
  `;

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

  return content;
}

function calculateWidth() {
  var mapWidth = map.getSize()[0];
  var sidebarWidth = mapWidth * 0.5;
  var resolution = map.getView().getResolution();
  var sidebarWidthInMapUnits = sidebarWidth * resolution;
  return sidebarWidthInMapUnits;
}

function transformCoordinates(coordinate) {
    if (Math.abs(coordinate[0]) <= 180 && Math.abs(coordinate[1]) <= 90) {
      coordinate = ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:3857');
      console.log("Koordinaten transformiert nach EPSG:3857:", coordinate);
    } else {
      console.log("Koordinaten bereits in EPSG:3857:", coordinate);
    }
    return coordinate; 
}

// zoom function
function zoomToFeatureOnLeftSide(feature) {
  var coordinate = feature.getGeometry().getCoordinates();
  coordinate = transformCoordinates(coordinate); 

  var view = map.getView();
  var targetZoomLevel = 16;
  let currentZoom = view.getZoom();
  console.log("currentZoom: ", currentZoom); 

  function centerPointOnTheLeft () {
    var extent = view.calculateExtent(map.getSize());
    var mapWidth = extent[2] - extent[0];

    var offsetX = mapWidth / 4; // move by 1/4 of map width
    var centerWithOffset = [coordinate[0] + offsetX, coordinate[1]];

    console.log("OffsetX:", offsetX);
    console.log("new center (with offset):", centerWithOffset);

    view.animate({
      center: centerWithOffset,
      duration: 800, 
      easing: ol.easing.easeOut
    });
  }

  // first: zoom and center point
  if(currentZoom < targetZoomLevel) {
    view.animate({
      center: coordinate,
      zoom: targetZoomLevel,
      duration: 800,
      easing: ol.easing.easeOut
    },
    // second: move map, so that the point is centered in the left half
    function() {
      centerPointOnTheLeft();
    });
  } else {
    centerPointOnTheLeft();
  }
}


function createCircle(color) {
  var circle = document.createElement("DIV");
  circle.className = "circle_aqindex_sidebar";
  circle.style.backgroundColor = getColorByAirQuality(color);
  return circle;
}

var dates = []; 
var pm25DataSD = []; 
var pm10DataSD = []; 
var pm25DataHM = []; 
var pm10DataHM = [];
var no2Data = []; 
var coData = []; 
let allFeatures = [];

function openSidebar(feature) {
  console.log("sidebarFeature: ", feature); 
  console.log("sidebarPointStyle1: ", feature.getStyle()); 
  feature.setStyle(pointStyleLarge(feature));
  console.log("sidebarPointStyle2: ", feature.getStyle()); 
  // zoom and position point on the left half 
  zoomToFeatureOnLeftSide(feature); 

  // making the close button visible 
  document.getElementById("sidebar").classList.add("open");

  // move searchbar to the left 
  document.getElementById("searchbar").classList.add("left"); 
  
  //sidebar.style.display = "block";    
  var content = ContentSidebar(feature);
  document.getElementById("sidebar").style.width = "50%";
  document.getElementById("map").style.marginRight = "50%";
  document.getElementById("sidebar-content").innerHTML = content;

  // Append the circle to the Air Quality Index paragraph
  var properties = feature.getProperties();
  var airQualityIndexElement = document.getElementById("airQualityIndex");
  var circle = createCircle(properties['Luftqualitätindex']);
  if(airQualityIndexElement) {
    airQualityIndexElement.insertBefore(circle, airQualityIndexElement.children[0]);
  }

  // Append a circle for each parameter
  var parameter_index = properties['Parameterindex']; 
  var PM2_5_SD_Element = document.getElementById("PM2_5_SD");
  var PM2_5_HM_Element = document.getElementById("PM2_5_HM");
  var PM10_SD_Element = document.getElementById("PM10_SD");
  var PM10_HM_Element = document.getElementById("PM10_HM");
  var NO2_Element = document.getElementById("NO2_MG");
  var CO_Element = document.getElementById("CO_MG");
  PM2_5_SD_Element.insertBefore(createCircle(parameter_index['pm2_5_SD']), PM2_5_SD_Element.children[0]); 
  PM2_5_HM_Element.insertBefore(createCircle(parameter_index['pm2_5_HM']), PM2_5_HM_Element.children[0]); 
  PM10_SD_Element.insertBefore(createCircle(parameter_index['pm10_SD']), PM10_SD_Element.children[0]); 
  PM10_HM_Element.insertBefore(createCircle(parameter_index['pm10_HM']), PM10_HM_Element.children[0]); 
  NO2_Element.insertBefore(createCircle(parameter_index['no2']), NO2_Element.children[0]); 
  CO_Element.insertBefore(createCircle(parameter_index['co']), CO_Element.children[0]); 


  //get data from geojson 
  fetch(dataFile)
  .then(function(response){
    return response.json(); 
  })
  .then(function(data){    
    // sort features by time
    /*console.log("fetch data: ", data); 
    console.log("Feature: ", feature);
    console.log("Feature Properties: ", feature.getProperties());
    console.log("Feature Name: ", feature.getProperties()['Name']);*/

    const filteredStations = data.features.filter(f => 
      f.properties['Name'] === feature.getProperties()['Name']
   );

    allFeatures = filteredStations.sort(function(a, b) {
    return new Date(b.properties.time) - new Date(a.properties.time);});

    // get min, max values for date filtering 
    var minDate = new Date(allFeatures[allFeatures.length - 1].properties.time);
    var maxDate = new Date(allFeatures[0].properties.time);
    console.log("mD: ", minDate); 
    console.log("maxD:", maxDate); 

    document.getElementById('startdate').min = minDate.toISOString().slice(0, 16);
    document.getElementById('startdate').max = maxDate.toISOString().slice(0, 16);
    document.getElementById('enddate').min = minDate.toISOString().slice(0, 16);
    document.getElementById('enddate').max = maxDate.toISOString().slice(0, 16);

    // Standard: Letzte 24 Stunden anzeigen
    var defaultEndDate = maxDate.toISOString().slice(0, 16);
    var defaultStartDate = new Date(maxDate - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    document.getElementById('startdate').value = defaultStartDate;
    document.getElementById('enddate').value = defaultEndDate;

    // Features filtern, die im Standard-Zeitintervall liegen
    var filteredFeatures = allFeatures.filter(function(feature) {
      var featureDate = new Date(feature.properties.time);
      return featureDate >= new Date(defaultStartDate) && featureDate <= new Date(defaultEndDate);
    });

    // Diagramm mit den gefilterten Daten erstellen
    createChart(filteredFeatures);
  })

  // add chart 
  const ctx = document.getElementById("myChart"); 


  function createChart(latestFeatures){

    dates = latestFeatures.map(feature => feature.properties.time); // Zeitstempel als X-Achse // const
    pm25DataSD = latestFeatures.map(feature => feature.properties["SD:PM2_5"]);
    pm10DataSD = latestFeatures.map(feature => feature.properties["SD:PM10"]);
    pm25DataHM = latestFeatures.map(feature => feature.properties["GM:PM2_5_Atm"]); 
    pm10DataHM = latestFeatures.map(feature => feature.properties["GM:PM10_Atm"]);
    no2Data = latestFeatures.map(feature => feature.properties["NO2"]);
    coData = latestFeatures.map(feature => feature.properties["CO"] * 1000); // Umrechnung von mg/m3 in μg/m³

    myChart = new Chart(ctx, {
      type: 'line', 
      data: {
        labels: dates.reverse(), 
        datasets: [
          {
            label: 'PM2.5 SDS011',
            data: pm25DataSD.reverse(),
            borderColor: 'rgb(87, 226, 94)',
            backgroundColor: 'rgba(87, 226, 94, 0.4)',
            tension: 0.1,
            pointRadius: 0,
          },
          {
            label: 'PM10 SDS011',
            data: pm10DataSD.reverse(),
            borderColor: 'rgb(6, 112, 11)',
            backgroundColor: 'rgba(6, 112, 11, 0.4)',
            tension: 0.1,
            pointRadius: 0,
          },
          {
            label: 'PM2.5 HM3301',
            data: pm25DataHM.reverse(),
            borderColor: 'rgb(255, 103, 153)',
            backgroundColor: 'rgba(255, 103, 153, 0.4)',
            tension: 0.1,
            pointRadius: 0,
          },
          {
            label: 'PM10 HM3301',
            data: pm10DataHM.reverse(),
            borderColor: 'rgb(164, 34, 197)',
            backgroundColor: 'rgba(164, 34, 197, 0.4)',
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
                text: 'Zeit'
            }
          },
          y: {
            display: true,
            title: {
                display: true,
                text: 'Konzentration (μg/m³)'
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
        colorBox.classList.add('color-box');
  
        // Farben aus myChart-Datasets lesen
        colorBox.style.backgroundColor = datasets[index]?.backgroundColor || '#000';
        colorBox.style.borderColor = datasets[index]?.borderColor || '#000'; 
  
        // Farbfeld nach der Checkbox einfügen
        checkbox.parentNode.insertBefore(colorBox, checkbox.nextSibling);
      });
    }
  }

  console.log("sidebarPointStyle3: ", feature.getStyle()); 
  // Set the large style for the selected feature
  //feature.setStyle(pointStyleLarge(feature));
  selectedFeature = feature;
  //selectedFeature.setStyle(pointStyleLarge(selectedFeature)); 
  smarttrack_air.changed();
}

function updateAll(selectall) {
  let selectallcheckbox = document.getElementById("selectallcheckbox"); 
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

function checkboxSelectAllChecker() {
  let selectallcheckbox = document.getElementById("selectallcheckbox"); 
  let checkboxes = document.querySelectorAll('.datacheckbox'); 

  let x = 0; 
  for(let i = 0; i <= checkboxes.length -1; i++) {
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

function updateChart(dataset) {
  const isDataShown = myChart.isDatasetVisible(dataset);  

  if (isDataShown === false) {
    myChart.show(dataset);  // show the dataset
  } else {
    myChart.hide(dataset);  // hide dataset
  }
  checkboxSelectAllChecker(); 
}; 

function filterData() {
  const startDate = new Date(document.getElementById('startdate').value);
  const endDate = new Date(document.getElementById('enddate').value);
  
  console.log("startDate: ", startDate, "\n", "endDate: ", endDate); 
  console.log("latestFeatures: ", allFeatures); 

  const filteredFeatures = allFeatures.filter(feature => {
    const featureDate = new Date(feature.properties.time);
    return featureDate >= startDate && featureDate <= endDate;
  });

  console.log("ff", filteredFeatures); 
  // extract data for chart
  const filteredDates = filteredFeatures.map(f => f.properties.time);
  const filteredPM25SD = filteredFeatures.map(f => f.properties["SD:PM2_5"]);
  const filteredPM10SD = filteredFeatures.map(f => f.properties["SD:PM10"]);
  const filteredPM25HM = filteredFeatures.map(f => f.properties["GM:PM2_5_Atm"]);
  const filteredPM10HM = filteredFeatures.map(f => f.properties["GM:PM10_Atm"]);
  const filteredNO2 = filteredFeatures.map(f => f.properties["NO2"]);
  const filteredCO = filteredFeatures.map(f => f.properties["CO"]);

  // refresh diagramm
  myChart.data.labels = filteredDates.reverse();
  myChart.data.datasets[0].data = filteredPM25SD.reverse();
  myChart.data.datasets[1].data = filteredPM10SD.reverse();
  myChart.data.datasets[2].data = filteredPM25HM.reverse();
  myChart.data.datasets[3].data = filteredPM10HM.reverse();
  myChart.data.datasets[4].data = filteredNO2.reverse();
  myChart.data.datasets[5].data = filteredCO.reverse();

  myChart.update(); 
}

function downloadAsPNG() {
  const imageLink = document.createElement("A"); 
  const canvas = document.getElementById("myChart"); 
  imageLink.download = "diagram.png"; 
  imageLink.href = canvas.toDataURL('image/png', 1); 
  //window.open(imageLink); 
  //document.write('<img src=" '+imageLink+' "/>'); 
  //console.log(imageLink.href); 
  imageLink.click(); 
}

function downloadAsJSON() {  
  const data = {
    labels: myChart.data.labels, // time stamp 
    datasets: myChart.data.datasets
    .filter((dataset, index) => myChart.isDatasetVisible(index)) // only get visible datasets 
    .map(dataset => ({
      label: dataset.label,
      data: dataset.data
    }))
  };

  const jsonFormat = data.labels.map((label, index) => {
    const entry = { timestamp: label };
    data.datasets.forEach(dataset => {
      entry[dataset.label] = dataset.data[index];
    });
    return entry;
  });

  const jsonString = jsonFormat.map(item => JSON.stringify(item)).join('\n'); // Formatierung für bessere Lesbarkeit
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "air_quality_data.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
  
function closeSidebar(feature) {
  document.getElementById("sidebar").style.width = "0";
  document.getElementById("map").style.marginRight = "-10%";
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';

  var coordinate = feature.getGeometry().getCoordinates();

  // transform coordinates if needed
  coordinate = transformCoordinates(coordinate); 

  // reset center 
  var sidebarWidthInMapUnits = calculateWidth();
  //var coordinate = feature.getGeometry().getCoordinates();
  var newCenter = [coordinate[0] - sidebarWidthInMapUnits/16, coordinate[1]];
  map.getView().animate({ center: newCenter, duration: 500 });
  //sidebar.style.display = "none";

  if (selectedFeature) {
    selectedFeature.setStyle(pointStyle(selectedFeature));
    selectedFeature = null;
  }

  // hiding the close button 
  document.getElementById("sidebar").classList.remove("open");

  // move searchbar back to the middle 
  document.getElementById("searchbar").classList.remove("left"); 
}
  