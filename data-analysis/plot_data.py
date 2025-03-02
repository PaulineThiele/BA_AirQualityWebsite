#
# ------ Air quality diagrams (line diagram) ------
#
# Plots the cleaned air quality sensor data with the reference data from a state measurement station. 
#
# Author: Pauline Thiele 
# 

import pandas as pd
import matplotlib.pyplot as plt
import json

#------ read data ------

# read data from state measuring station in Wildau 
df = pd.read_excel("250117-Zi-Datenanfrage_Thiele_Wildau_cleaned.xlsx", sheet_name='Sheet1')
df['Zeitpunkt'] = pd.to_datetime(df['Zeitpunkt'], format='%Y-%m-%d %H:%M:%S')
df.set_index('Zeitpunkt', inplace=True) 

# read cleaned and half-hour sensor data 
with open('half_hour_average_19.12.24-17.01.25_+3h_unit_correction.json') as file: 
    data =[]
    
    for line in file:
        data.append(json.loads(line))

df_sens = pd.DataFrame.from_dict(data)
df_sens['time'] = pd.to_datetime(df_sens['time'], format='%Y-%m-%d %H:%M')
df_sens.set_index('time', inplace=True)


# read cleaned and half-hour sensor data with NO2 and CO value correction  
with open('half_hour_average_19.12.24-17.01.25_NO2_CO_correction.json') as file: 
    data =[]
    
    for line in file:
        data.append(json.loads(line))

df_kal = pd.DataFrame.from_dict(data)
df_kal['time'] = pd.to_datetime(df_kal['time'], format='%Y-%m-%d %H:%M:%S')
df_kal.set_index('time', inplace=True)


#------ plot data ------

#///////////////////////// plot PM2,5 data from SDS011 & HM3301 /////////////////////////
plt.figure(figsize=(14, 7))

plt.plot(df.index, df['PM2.5 [µg/m3]'], label='PM2,5 Messstation des LfU', color='tab:orange')
plt.plot(df_sens.index, df_sens['SD:PM2_5'], label='PM2,5 Sensor SDS011', color='tab:green')
plt.plot(df_sens.index, df_sens['GM:PM2_5_Atm'], label='PM2,5 Sensor HM3301', color='tab:purple')

plt.xlabel('Zeit')
plt.ylabel('PM2,5-Konzentration [µg/m3]')
plt.legend()
plt.grid(True)
plt.title('Messung der PM2,5-Konzentration durch SDS011, HM3301 und LfU in Wildau')#### das hier hab ich raus genommen 
plt.show()

#///////////////////////// plot PM10 data from SDS011 & HM3301 /////////////////////////
plt.figure(figsize=(14, 7))

plt.plot(df.index, df['PM10 [µg/m3]'], label='PM10 Messstation des LfU', color='tab:orange')
plt.plot(df_sens.index, df_sens['SD:PM10'], label='PM10 Sensor SDS011', color='tab:green')
plt.plot(df_sens.index, df_sens['GM:PM10_Atm'], label='PM10 Sensor HM3301', color='tab:purple')

plt.title('Messung der PM10-Konzentration durch SDS011, HM3301 und LfU in Wildau')
plt.xlabel('Zeit')
plt.ylabel('PM10-Konzentration [µg/m3]')
plt.legend()
plt.grid(True)
plt.show()

#///////////////////////// plot NO2 data from Grove - Mehrkanal-Gassensor V2 /////////////////////////
plt.figure(figsize=(14, 7))
plt.plot(df.index, df['NO2 [µg/m3]'], label='NO2 Messstation des LfU', color='tab:orange')

# cleaned sensor data without data correction 
#plt.plot(df_sens.index, df_sens['NO2'], label='NO2 Sensor Grove - MG V2', color='tab:cyan')
#plt.title('NO2-Konzentration des Grove - Mehrkanal-Gassensors V2 und Messung der NO2-Konzentration durch das LfU in Wildau')

# cleaned and corrected sensor data 
plt.plot(df_kal.index, df_kal['NO2'], label='NO2 Sensor Grove - MG V2', color='tab:cyan')
plt.title('korrigierte NO2-Konzentration des Grove - Mehrkanal-Gassensors V2 und Messung der NO2-Konzentration durch das LfU in Wildau')

plt.xlabel('Zeit')
plt.ylabel('NO2-Konzentration [µg/m3]')
plt.legend()
plt.grid(True)
plt.show()

#///////////////////////// plot CO data from Grove - Mehrkanal-Gassensor V2 /////////////////////////
plt.figure(figsize=(14, 7))
plt.plot(df.index, df['CO [mg/m3]'], label='CO Messstation des LfU', color='tab:orange')

# cleaned sensor data without data correction 
#plt.plot(df_sens.index, df_sens['CO'], label='CO Sensor Grove - MG V2', color='tab:cyan')
#plt.title('CO-Konzentration des Grove - Mehrkanal-Gassensors V2 und Messung der CO-Konzentration durch das LfU in Wildau')

# cleaned and corrected sensor data 
plt.plot(df_kal.index, df_kal['CO'], label='CO Sensor Grove - MG V2', color='tab:cyan')
plt.title('korrigierte CO-Konzentration des Grove - Mehrkanal-Gassensors V2 und Messung der CO-Konzentration durch das LfU in Wildau')

plt.xlabel('Zeit')
plt.ylabel('CO-Konzentration [mg/m3]')
plt.legend()
plt.grid(True)
plt.show()
