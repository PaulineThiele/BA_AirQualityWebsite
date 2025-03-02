#
# ------ Calculate correction value for NO2 &CO ------
#
# Calculates the median deviation value for NO2. The median was chosen, because the dataset has big extrema.  
# Calculates the mean deviation value for CO. The mean was chosen, because the dataset has very few extrema. 
#
# Subtracts the calculated median/mean value from the data set. 
#
# The calculation is done for the half-hour and hour dataset, because the corrected values are used in the diagram (half-hour values) and in the website (hour values). 
#
# Author: Pauline Thiele 
# 

import json 
import pandas as pd 

#------ read data ------

# read cleaned data from state measuring station in Wildau 
df = pd.read_excel("250117-Zi-Datenanfrage_Thiele_Wildau_cleaned.xlsx", sheet_name='Sheet1')
df['Zeitpunkt'] = pd.to_datetime(df['Zeitpunkt'], format='%Y-%m-%d %H:%M:%S')
df.set_index('Zeitpunkt', inplace=True)

# read cleaned, corrected and half-hour sensor data 
with open('half_hour_average_19.12.24-17.01.25_+3h_unit_correction.json') as file: # for half-hour average calculation 
#with open('hour_average_19.12.24-17.01.25_+3h_unit_correction.json') as file: # for hour average calculation 
    data =[]
    
    for line in file:
        data.append(json.loads(line))

df_sens = pd.DataFrame.from_dict(data)  
df_sens['time'] = pd.to_datetime(df_sens['time'], format='%Y-%m-%d %H:%M')
df_sens.set_index('time', inplace=True)

df_deviation = pd.DataFrame()
df_new = pd.DataFrame()

# merge data frames 
df_combined = df.merge(df_sens, left_index=True, right_index=True, suffixes=('_lfu', '_sens'))

# calculate absolute deviation for each row
df_combined['NO2_Abw'] = ((df_combined['NO2'] - df_combined['NO2 [µg/m3]'])) 
df_combined['CO_Abw'] = ((df_combined['CO'] - df_combined['CO [mg/m3]'])) 

# calculate median and mean deviation for the whole time period 
median_NO2 = df_combined.loc[:, 'NO2_Abw'].median().round(4)
mean_CO = df_combined.loc[:, 'CO_Abw'].mean().round(4)

print("NO2 median: ", median_NO2) # 19.4811
print("CO mean: ", mean_CO) # 1.2073

# delete existing NO2 & CO columns
df_new = df_new.merge(df_sens, left_index=True, right_index=True)
df_new = df_sens.drop(['NO2', 'CO'], axis=1)

# calculate corrected NO2 and CO values and add them to the new data frame 
df_new['NO2'] = df_combined['NO2'] - median_NO2 
df_new['CO'] = df_combined['CO'] - mean_CO

df_new.reset_index(inplace=True)
df_new['time'] = df_new['time'].dt.strftime('%Y-%m-%d %H:%M:%S')

df_new.to_json("half_hour_average_19.12.24-17.01.25_NO2_CO_correction.json", orient='records', lines=True) # for half-hour average calculation
#df_new.to_json("hour_average_19.12.24-17.01.25_NO2_CO_correction.json", orient='records', lines=True) # for hour average calculation 