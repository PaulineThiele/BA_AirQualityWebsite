#
# ------ Tranform .json file to .geojson file ------
#
# Transformation includes the calculation of the parameter index for PM2,5, PM10 and NO2 and the calculation of the air quality index. 
#
# Author: Pauline Thiele 
# 

import json 
import geojson

# read .json file 
with open('hour_average_19.12.24-17.01.25_NO2_CO_correction.json') as file:
    data =[]
    
    for line in file:
        data.append(json.loads(line))


#
# Calculates the PM2.5 index based on https://www.umweltbundesamt.de/berechnungsgrundlagen-luftqualitaetsindex 
# @return {number}
#
def pm25Calc(number): 
    if number == None: 
        return 0
    elif number <= 10: 
        return 1
    elif number <= 20: 
        return 2
    elif number <= 25: 
        return 3
    elif number <= 50: 
        return 4
    else: 
        return 5


#
# Calculates the PM10 index based on https://www.umweltbundesamt.de/berechnungsgrundlagen-luftqualitaetsindex 
# @return {number}
#
def pm10Calc(number): 
    if number == None: 
        return 0
    elif number <= 20: 
        return 1
    elif number <= 35: 
        return 2
    elif number <= 50: 
        return 3
    elif number <= 100: 
        return 4
    else: 
        return 5


#
# Calculates the NO2 index based on https://www.umweltbundesamt.de/berechnungsgrundlagen-luftqualitaetsindex 
# @return {number}
#
def  no2Calc(number): 
    if number == None: 
        return 0
    elif number <= 20: 
        return 1
    elif number <= 40: 
        return 2
    elif number <= 100: 
        return 3
    elif number <= 200: 
        return 4
    else: 
        return 5


# 
# Updates parameter index. 
# @param {object}
# @return {dict}
#
def paramIndex (data): 
    dict = {}

    pm25HM = pm25Calc(data.get("GM:PM2_5_Atm", 0))
    pm25SD = pm25Calc(data.get("SD:PM2_5", 0))
    pm10HM = pm10Calc(data.get("GM:PM10_Atm", 0))
    pm10SD = pm10Calc(data.get("SD:PM10", 0))
    no2 = no2Calc(data.get("NO2", 0))
    #co = 0 # There is no CO parameter calculation, because a categorisation for this index dosn't exist. 
    
    dict.update({
        "pm2_5_HM": pm25HM, 
        "pm2_5_SD": pm25SD, 
        "pm10_HM": pm10HM, 
        "pm10_SD": pm10SD, 
        "no2": no2, 
        #"co": co
    })

    return dict


#
# Calculates and returns the maximum parameter index as air quality index. 
# Based on: https://www.umweltbundesamt.de/berechnungsgrundlagen-luftqualitaetsindex 
# @param {object}
# @return {string}
#
def calcAqi (data): 
    dict = {}
    dict.update(paramIndex(data))
    aqi = dict.get(max(dict, key=dict.get))
    return aqi


# static air values 
additionalProperties = {
    "Name": "12345",
    "Temperatur [°C]": 25.2,
    "NHN Höhe [m]": 100,
    "Luftdruck [hPa]": 1016.6,
    "Luftfeuchte [%]": 37.7,
    "UTM-Nord [m]": 5681893.904,
    "UTM-Ost [m]": 490140.608
}


#
# Creates and returns the station ID. 
# @param {object}
# @return {string}
#
def createID (data):
    zeit = data.get("time")
    id = f"station-12345-{zeit}"
    return id


# geojson format 
geojs={
     "type": "FeatureCollection",
     "features":[
           {
                "geometry": {
                "coordinates": [13.62124100, 52.32402700, 100], #[13.62377300, 52.32196800, 100],
                "type": "Point"
            },
                "id": createID(d),
                "properties": {**d, **additionalProperties, "Luftqualitätsindex": calcAqi(d), "Parameterindex": paramIndex(d)}, 
                
                "srsName": "EPSG:4326",
                "type": "Feature"
         }
         for d in data
    ]  
 }

# create .geojson file
with open("hour_created_geodata.json", "w", encoding="utf-8") as outputFile:
    geojson.dump(geojs, outputFile, indent=4)
    print("GeoJSON created successfully!")

# After successfully creating the .json file simply change the ending of the file from "json" to "geojson". 