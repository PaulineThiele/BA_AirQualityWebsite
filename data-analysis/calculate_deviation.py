#
# ------ Calculate deviation ------
#
# Calculates the absolute deviation of the air quality sensor data from the reference data of a state measuring station. 
# The state measuring station is located in Wildau. 
# Data comes from the Landesamt für Umwelt Brandenburg. 
#
# Author: Pauline Thiele 
# 

import pandas as pd
import json

#------ read data ------

# read data from state measuring station in Wildau 
df = pd.read_excel("250117-Zi-Datenanfrage_Thiele_Wildau_cleaned.xlsx", sheet_name='Sheet1')
df['Zeitpunkt'] = pd.to_datetime(df['Zeitpunkt'], format='%Y-%m-%d %H:%M:%S')
df.set_index('Zeitpunkt', inplace=True)

# read cleaned, corrected and half-hour sensor data 
with open('half_hour_average_19.12.24-17.01.25_NO2_CO_correction.json') as file:
    data =[]
    
    for line in file:
        data.append(json.loads(line))

df_sens = pd.DataFrame.from_dict(data)  
df_sens['time'] = pd.to_datetime(df_sens['time'], format='%Y-%m-%d %H:%M:%S')
df_sens.set_index('time', inplace=True)


#------ calculate deviation ------

# combine data frames 
df_combined = df.merge(df_sens, left_index=True, right_index=True, suffixes=('_lfu', '_sens'))

# calculate absolute deviation 
df_combined['NO2_Abw'] = ((df_combined['NO2'] - df_combined['NO2 [µg/m3]'])) 
df_combined['CO_Abw'] = ((df_combined['CO'] - df_combined['CO [mg/m3]'])) 
df_combined['PM2.5_Abw_HM3301'] = ((df_combined['GM:PM2_5_Atm'] - df_combined['PM2.5 [µg/m3]']))
df_combined['PM2.5_Abw_SDS011'] = ((df_combined['SD:PM2_5'] - df_combined['PM2.5 [µg/m3]']))
df_combined['PM10_Abw_HM3301'] = ((df_combined['GM:PM10_Atm'] - df_combined['PM10 [µg/m3]']))
df_combined['PM10_Abw_SDS011'] = ((df_combined['SD:PM10'] - df_combined['PM10 [µg/m3]']))

# create new data frame for results and safe results into a .json file
df_deviation = pd.DataFrame()
df_deviation = df_combined[['NO2_Abw', 'CO_Abw', 'PM2.5_Abw_HM3301', 'PM2.5_Abw_SDS011', 'PM10_Abw_HM3301', 'PM10_Abw_SDS011']]

df_deviation.reset_index(inplace=True)
df_deviation.rename(columns={'index': 'time'}, inplace=True)
df_deviation['time'] = df_deviation['time'].dt.strftime('%Y-%m-%d %H:%M:%S')

df_deviation.to_json("half_hour_deviation.json", orient='records', lines=True)

#print(df_deviation)