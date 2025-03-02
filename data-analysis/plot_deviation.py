#
# ------ Deviation air quality diagrams (line diagram) ------
#
# Plots the absolute deviation of the air quality sensor data from the reference data of a state measuring station. 
# The diagram contains the humidity measured by the state measuring station from the "Landesamt für Umwelt Brandenburg". 
#
# Author: Pauline Thiele 
# 

import pandas as pd
import matplotlib.pyplot as plt
import json

# ------ read data ------

# read data from state measuring station in Wildau 
df = pd.read_excel("250117-Zi-Datenanfrage_Thiele_Wildau_cleaned.xlsx", sheet_name='Sheet1')
df['Zeitpunkt'] = pd.to_datetime(df['Zeitpunkt'], format='%Y-%m-%d %H:%M:%S')
df.set_index('Zeitpunkt', inplace=True)

# read cleaned and half-hour deviation sensor data 
with open('half_hour_deviation.json') as file:
    data =[]
    
    for line in file:
        data.append(json.loads(line))

df_deviation = pd.DataFrame.from_dict(data)
df_deviation['time'] = pd.to_datetime(df_deviation['time'], format='%Y-%m-%d %H:%M:%S')
df_deviation.set_index('time', inplace=True)


# ------ plot data ------

# ///////////////////////// plot PM2,5 deviation data from SDS011 & HM3301 with humidity data /////////////////////////
fig_Abw, ax1_Abw = plt.subplots(figsize=(14, 7))

# left y-axis for air quality data & x-axis 
ax1_Abw.axhline(y=0, color='tab:orange', linestyle='--', linewidth=2, label='PM2,5-Referenzlinie des LfU')
ax1_Abw.plot(df_deviation.index, df_deviation['PM2.5_Abw_SDS011'], label='PM2,5-Abweichung SDS011', color='tab:green')
ax1_Abw.plot(df_deviation.index, df_deviation['PM2.5_Abw_HM3301'], label='PM2,5-Abweichung HM3301', color='tab:purple')
ax1_Abw.set_xlabel('Zeit')
ax1_Abw.set_ylabel('PM2,5-Abweichung [µg/m3]')
ax1_Abw.tick_params(axis='y')
ax1_Abw.legend(loc='upper left')
ax1_Abw.grid(True)

ax2_Abw = ax1_Abw.twinx()

# right y-axis for humidity 
ax2_Abw.plot(df.index, df['Feuchte [%]'], label='Luftfeuchtigkeit [%]', color='tab:blue')
ax2_Abw.set_ylabel('Luftfeuchtigkeit [%]', color='tab:blue')
ax2_Abw.tick_params(axis='y', labelcolor='tab:blue')

# right y-axis for pressure 
'''ax2_Abw.plot(df.index, df['Druck [hPa]'], label='Luftdruck [hPa]', color='tab:pink')
ax2_Abw.set_ylabel('Luftdruck [hPa]', color='tab:pink')
ax2_Abw.tick_params(axis='y', labelcolor='tab:pink')'''

ax2_Abw.legend(loc='upper right')

plt.title('Abweichung der PM2,5-Konzentration des SDS011 und HM3301 von der LfU-Messstation Wildau und Darstellung der Luftfeuchtigkeit')
#plt.title('Abweichung der PM2,5-Konzentration des SDS011 und HM3301 von der LfU-Messstation Wildau und Darstellung des Luftdrucks')
plt.show()

# ///////////////////////// Abweichung PM10 SDS011 ////////////////////////////
fig_Abw, ax1_Abw = plt.subplots(figsize=(14, 7))

# left y-axis for air quality data & x-axis 
ax1_Abw.axhline(y=0, color='tab:orange', linestyle='--', linewidth=2, label='PM10-Referenzlinie des LfU')
ax1_Abw.plot(df_deviation.index, df_deviation['PM10_Abw_SDS011'], label='PM10-Abweichung SDS011', color='tab:green')
ax1_Abw.plot(df_deviation.index, df_deviation['PM10_Abw_HM3301'], label='PM10-Abweichung HM3301', color='tab:purple')
ax1_Abw.set_xlabel('Zeit')
ax1_Abw.set_ylabel('PM10-Abweichung [µg/m3]')
ax1_Abw.tick_params(axis='y')
ax1_Abw.legend(loc='upper left')
ax1_Abw.grid(True)

ax2_Abw = ax1_Abw.twinx()

# right y-axis for humidity 
ax2_Abw.plot(df.index, df['Feuchte [%]'], label='Luftfeuchtigkeit [%]', color='tab:blue')
ax2_Abw.set_ylabel('Luftfeuchtigkeit [%]', color='tab:blue')
ax2_Abw.tick_params(axis='y', labelcolor='tab:blue')

# right y-axis for pressure 
'''ax2_Abw.plot(df.index, df['Druck [hPa]'], label='Luftdruck [hPa]', color='tab:pink')
ax2_Abw.set_ylabel('Luftdruck [hPa]', color='tab:pink')
ax2_Abw.tick_params(axis='y', labelcolor='tab:pink')'''

ax2_Abw.legend(loc='upper right')

plt.title('Abweichung der PM10-Konzentration des SDS011 und HM3301 von der LfU-Messstation Wildau und Darstellung der Luftfeuchtigkeit')
#plt.title('Abweichung der PM10-Konzentration des SDS011 und HM3301 von der LfU-Messstation Wildau und Darstellung des Luftdrucks')
plt.show()

# ///////////////////////// Abweichung NO2 Grove-MK V2 ////////////////////////////
fig_Abw, ax1_Abw = plt.subplots(figsize=(14, 7))

# left y-axis for air quality data & x-axis 
ax1_Abw.axhline(y=0, color='tab:orange', linestyle='--', linewidth=2, label='NO2-Referenzlinie des LfU')
ax1_Abw.plot(df_deviation.index, df_deviation['NO2_Abw'], label='NO2-Abweichung Grove - MG V2', color='tab:cyan')
ax1_Abw.set_xlabel('Zeit')
ax1_Abw.set_ylabel('NO2-Abweichung [µg/m3]')
ax1_Abw.tick_params(axis='y')
ax1_Abw.legend(loc='upper left')
ax1_Abw.grid(True)

# right y-axis for humidity 
ax2_Abw = ax1_Abw.twinx() 
ax2_Abw.plot(df.index, df['Feuchte [%]'], label='Luftfeuchtigkeit [%]', color='tab:blue')
ax2_Abw.set_ylabel('Luftfeuchtigkeit [%]', color='tab:blue')
ax2_Abw.tick_params(axis='y', labelcolor='tab:blue')
ax2_Abw.legend(loc='upper right')

plt.title('Abweichung der korrigierten NO2-Konzentration des Grove - Mehrkanal-Gassensors V2 von der LfU-Messstation Wildau und Darstellung der Luftfeuchtigkeit')
plt.show()

# ///////////////////////// Abweichung CO Grove-MK V2 ////////////////////////////
fig_Abw, ax1_Abw = plt.subplots(figsize=(14, 7))

# left y-axis for air quality data & x-axis 
ax1_Abw.axhline(y=0, color='tab:orange', linestyle='--', linewidth=2, label='CO-Referenzlinie des LfU')
ax1_Abw.plot(df_deviation.index, df_deviation['CO_Abw'], label='CO-Abweichung Grove - MG V2', color='tab:cyan')
ax1_Abw.set_xlabel('Zeit')
ax1_Abw.set_ylabel('CO-Abweichung [mg/m3]')
ax1_Abw.tick_params(axis='y')
ax1_Abw.legend(loc='upper left')
ax1_Abw.grid(True)

# right y-axis for humidity 
'''ax2_Abw = ax1_Abw.twinx()
ax2_Abw.plot(df.index, df['Druck [hPa]'], label='Luftfeuchtigkeit [%]', color='tab:blue')
ax2_Abw.set_ylabel('Luftfeuchtigkeit in [%]', color='tab:blue')
ax2_Abw.tick_params(axis='y', labelcolor='tab:blue')
ax2_Abw.legend(loc='upper right')'''

plt.title('Abweichung der korrigierten CO-Konzentration des Grove - Mehrkanal-Gassensors V2 von der LfU-Messstation Wildau')
plt.show()