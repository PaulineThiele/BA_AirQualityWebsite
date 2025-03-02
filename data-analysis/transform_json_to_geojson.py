#
# ------ Tranform .json file to .geojson file ------
#
# Author: Pauline Thiele 
# 

import json 
import geojson

# read .json file 
with open('half_hour_average_19.12.24-17.01.25_NO2_CO_correction.json') as file:
    data =[]
    
    for line in file:
        data.append(json.loads(line))

# static air values 
additional_properties = {
    "Name": "12345",
    "Temperatur [°C]": 25.2,
    "NHN Höhe [m]": 100,
    "Luftdruck [hPa]": 1016.6,
    "Luftfeuchte [%]": 37.7,
    "UTM-Nord [m]": 5681893.904,
    "UTM-Ost [m]": 490140.608
}

# geojson format 
geojs={
     "type": "FeatureCollection",
     "features":[
           {
                "geometry": {
                "coordinates": [13.62124100, 52.32402700, 100],
                "type": "Point"
            },
                "id": "12345",
                "properties":{**d, **additional_properties},
                
                "srsName": "EPSG:4326",
                "type": "Feature"
         }
         for d in data
    ]  
 }

# create .geojson file
with open("created_geodata.json", "w", encoding="utf-8") as output_file:
    geojson.dump(geojs, output_file, indent=4)
    print("GeoJSON created successfully!")

# After successfully creating the .json file simply change the ending of the file from "json" to "geojson". 