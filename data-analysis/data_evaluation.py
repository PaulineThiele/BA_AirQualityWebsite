#
# ------ evaluation ------
#
# Counts the number of exceedings of the operating sensor humidity per used sensor. 
# Calculates the mean deviation of the sensor values from the state measuring station (LfU). 
#
# Author: Pauline Thiele 
# 

import pandas as pd
import json


# ------ count number of exceedings of the operating sensor humidity ------

# read cleaned LfU data
df = pd.read_excel("250117-Zi-Datenanfrage_Thiele_Wildau_cleaned.xlsx", sheet_name='Sheet1')
df['Zeitpunkt'] = pd.to_datetime(df['Zeitpunkt'], format='%Y-%m-%d %H:%M:%S')
df.set_index('Zeitpunkt', inplace=True)

print("Temp. min.: ", df['Temp [°C ]'].min())
print("Temp. max.: ", df['Temp [°C ]'].max())

print("Humidity min.: ", df['Feuchte [%]'].min())
print("Humidity max.: ", df['Feuchte [%]'].max())


count_rows = df[df['Feuchte [%]'] >= 0].count()['Feuchte [%]']
print("Number of rows in dataset:", count_rows)

count_humidity_55 = df[df['Feuchte [%]'] >= 55].count()['Feuchte [%]'] # Operating humidity of Grove - Mehrkanal-Gassensor V2
print("Occurrences of >= 55% RH:", count_humidity_55)

count_humidity_70 = df[df['Feuchte [%]'] >= 70].count()['Feuchte [%]'] # Operating humidity of SDS011
print("Occurrences of >= 70% RH:", count_humidity_70)

count_humidity_90 = df[df['Feuchte [%]'] >= 90].count()['Feuchte [%]'] # Operating humidity of HM3301
print("Occurrences of >= 90% RH:", count_humidity_90)



# ------ calculate the mean deviation ------

with open('half_hour_deviation.json') as file:
    data =[]
    
    for line in file:
        data.append(json.loads(line))

df = pd.DataFrame.from_dict(data)
df['time'] = pd.to_datetime(df['time'], format='%Y-%m-%d %H:%M:%S')
df.set_index('time', inplace=True)

print("mean deviation: SDS PM2,5: ", df['PM2.5_Abw_SDS011'].mean())
print("mean deviation: SDS PM10: ", df['PM10_Abw_SDS011'].mean())

print("mean deviation: HM PM2,5: ", df['PM2.5_Abw_HM3301'].mean())
print("mean deviation: HM PM10: ", df['PM10_Abw_HM3301'].mean())

print("mean deviation: NO2: ", df['NO2_Abw'].mean())
print("mean deviation: CO: ", df['CO_Abw'].mean())

count_PM2_5_10Abw = df[df['PM2.5_Abw_SDS011'] >= 10].count()['PM2.5_Abw_SDS011']
print("Number of PM2,5 exceedings of +-10% deviation for SDS011", count_PM2_5_10Abw)

count_PM10_10Abw = df[df['PM10_Abw_SDS011'] >= 10].count()['PM10_Abw_SDS011']
print("Number of PM2,5 exceedings of +-10% deviation for SDS011", count_PM10_10Abw)