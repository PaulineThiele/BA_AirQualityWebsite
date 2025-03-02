#
# ------ Clean data ------
#
# Cleans the air quality data from the state measuring station (LfU). 
# Cleans the air quality data from the sensors. 
# Claculates half-hour average from the air quality data of the sensors for creating diagrams. 
# Claculates hour average from the air quality data of the sensors for visualising the data on the website. 
# Converts units for NO2 and CO sensor data. 
#
# Author: Pauline Thiele 
# 

import pandas as pd
import numpy as np
import json


#------ clean LfU data ------
df = pd.read_excel("250117-Zi-Datenanfrage_Thiele_Wildau.xlsx", sheet_name='Daten') 

# changes 24:00 to 00:00 
def adjust_time(timestamp):
    timestamp_str = str(timestamp)
    if '24:00' in timestamp_str:
        date_part = timestamp_str.split(' ')[0]
        new_date = pd.to_datetime(date_part, format='%d.%m.%Y') + pd.Timedelta(days=1)
        return new_date.strftime('%d.%m.%Y 00:00')
    return timestamp_str

# turn time string to date time format 
df['Zeitpunkt'] = df['Zeitpunkt'].apply(adjust_time) 
df['Zeitpunkt'] = pd.to_datetime(df['Zeitpunkt'], format='%d.%m.%Y %H:%M')

# replace a field with '    # ' with an empty value 
df.replace('    # ', np.nan, inplace=True)

# safe changes in a new Excel file 
df.to_excel("250117-Zi-Datenanfrage_Thiele_Wildau_cleaned.xlsx", index=False)



#------ change time stamp to correct time (+3h), because the used Raspberry Pi had issues with getting the correct time ------

# read data 
with open('all_data_19.12.24-17.01.25 copy.json') as file:
    data =[]
    
    for line in file:
        data.append(json.loads(line))

# trun time to date time format and set time as index 
df = pd.DataFrame.from_dict(data)
df['time'] = pd.to_datetime(df['time'], format='[%Y-%m-%dT%H:%M:%S.%f]')

# time + 3h
df['time'] = df['time'] + pd.Timedelta(hours=3)

# save results in new .json file 
df['time'] = df['time'].dt.strftime('%Y-%m-%d %H:%M')
df.to_json("all_data_19.12.24-17.01.25_+3h.json", orient='records', lines=True)



#------ calculate averages of sensor data ------
# 
# Calculates the half-hour average for air quality diagrams. 
# Calculates the hour average for displaying the air quality on the website. 
# 

# read cleaned file
with open('all_data_19.12.24-17.01.25_+3h.json') as file:
    data =[]
    
    for line in file:
        data.append(json.loads(line))

# trun time to date time format and set time as index 
df = pd.DataFrame.from_dict(data)
df['time'] = pd.to_datetime(df['time'], format='%Y-%m-%d %H:%M')
df.set_index('time', inplace=True)

calculate_df = pd.DataFrame()
result_df = pd.DataFrame()

#
#   Calculates the average of half an hour or an hour and saves it into a data frame. 
#   @param {dataframe} calculate_df
#   @param {dataframe} result_df
#
def calculate_and_append(calculate_df, result_df):
    if not calculate_df.empty:
        mean_values = calculate_df.mean().round(4)
        mean_values_df = pd.DataFrame([mean_values])
        mean_values_df.insert(0, 'time', calculate_df.index[-1])
        result_df = result_df._append(mean_values_df, ignore_index=True)
    return result_df

# iterates through each line of data frame
for time, row in df.iterrows():

    if calculate_df.empty or (time - calculate_df.index[0]).seconds < 1800: # for half-hour average calculation 
    #if calculate_df.empty or (time - calculate_df.index[0]).seconds < 3600: # for hour average calculation 
        # adds the row to data frame, if there is not yet half an hour  
        calculate_df = calculate_df._append(row)
    else:
        result_df = calculate_and_append(calculate_df, result_df)
        #creates new data frame & add the current row to it 
        calculate_df = pd.DataFrame()
        calculate_df = calculate_df._append(row)

# save results in new .json file 
result_df['time'] = result_df['time'].dt.strftime('%Y-%m-%d %H:%M')
result_df.to_json("half_hour_average_19.12.24-17.01.25_+3h.json", orient='records', lines=True) # for half-hour average calculation 
#result_df.to_json("hour_average_19.12.24-17.01.25_+3h.json", orient='records', lines=True) # for hour average calculation 



#------ convert units for NO2 and CO sensor data ------
# 
# NO2: 
#   convert from ppm to µg/m3
#   1 µg/m3 = 0,52293 ppb    1 ppb = 1,9123 µg/m3 
#   1 ppm  = 1000 ppb 
#
# CO: 
#   convert from ppm to mg/m3
#   1 mg/m3 = 0,85911 ppm    1 ppm = 1,1640 mg/m3
#
# source: https://www.umweltbundesamt.at/fileadmin/site/publikationen/REP0276.pdf (accessed on: 25.01.2025, page 6)
# 

# read data
with open('half_hour_average_19.12.24-17.01.25_+3h.json') as file: # for half-hour average calculation 
#with open('hour_average_19.12.24-17.01.25_+3h.json') as file: # for hour average calculation 
    data =[]
    
    for line in file:
        data.append(json.loads(line))

# trun time to date time format and set time as index 
df = pd.DataFrame.from_dict(data)
df['time'] = pd.to_datetime(df['time'], format='%Y-%m-%d %H:%M')
df.set_index('time', inplace=True)

result_df = pd.DataFrame()

# iterates through each line of data frame and convert units 
for time, row in df.iterrows():
    row['NO2'] = row['NO2'] * 1000 * 1.9123 # ppm -> µg/m3
    row['CO'] = row['CO'] * 1.1640 # ppm -> mg/m3
    result_df = result_df._append(row)

# reset data frame index, turn time into time format 
result_df.reset_index(inplace=True)
result_df.rename(columns={'index':'time'}, inplace=True)
result_df['time'] = result_df['time'].dt.strftime('%Y-%m-%d %H:%M')

# save results in new .json file 
result_df.to_json("half_hour_average_19.12.24-17.01.25_+3h_unit_correction.json", orient='records', lines=True) # for half-hour average calculation 
#result_df.to_json("hour_average_19.12.24-17.01.25_+3h_unit_correction.json", orient='records', lines=True) # for hour average calculation 
