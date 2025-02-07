import json 
import sys 
import geojson

with open('half_hour_data_19.12.24-17.01.25_calculated_NO2_CO_kalibration.json') as file:
    data =[]
    
    for line in file:
        data.append(json.loads(line))

def pm2_5_calc(number): 
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
    
def pm10_calc(number): 
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

def  no2_calc(number): 
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

def param_index (data): 
    dict = {}

    pm2_5_HM = pm2_5_calc(data.get("GM:PM2_5_Atm", 0))
    pm2_5_SD = pm2_5_calc(data.get("SD:PM2_5", 0))
    pm10_HM = pm10_calc(data.get("GM:PM10_Atm", 0))
    pm10_SD = pm10_calc(data.get("SD:PM10", 0))
    no2 = no2_calc(data.get("NO2", 0))
    co = 0 
    
    dict.update({
        "pm2_5_HM": pm2_5_HM, 
        "pm2_5_SD": pm2_5_SD, 
        "pm10_HM": pm10_HM, 
        "pm10_SD": pm10_SD, 
        "no2": no2, 
        "co": co
    })

    return dict

def calc_aqi (data): 
    dict = {}
    dict.update(param_index(data))
    aqi = dict.get(max(dict, key=dict.get))
    return aqi

additional_properties = {
    "Name": "12345",
    "Temperatur [°C]": 25.2,
    "NHN Höhe [m]": 100,
    "Luftdruck [hPa]": 1016.6,
    "Luftfeuchte [%]": 37.7,
    "UTM-Nord [m]": 5681893.904,
    "UTM-Ost [m]": 490140.608
}

def create_ID (data):
    zeit = data.get("time")
    id = f"station-12345-{zeit}"
    return id

geojs={
     "type": "FeatureCollection",
     "features":[
           {
                "geometry": {
                "coordinates": [13.62377300, 52.32196800, 100],
                "type": "Point"
            },
                "id": create_ID(d),
                "properties": {**d, **additional_properties, "Luftqualitätindex": calc_aqi(d), "Parameterindex": param_index(d)}, 
                
                "srsName": "EPSG:4326",
                "type": "Feature"
         }
         for d in data
    ]  
 }


with open("created_geodata.json", "w", encoding="utf-8") as output_file:
    geojson.dump(geojs, output_file, indent=4)
    print("GeoJSON created successfully!")