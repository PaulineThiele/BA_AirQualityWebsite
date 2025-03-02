#!/usr/bin/env python3

import signal
import time
import datetime
import threading
import json
import logging
import shutil
import os

import Seeed_HM3301
import grove_multichannel_gas_sensor
import SDS011Reader


################################################### Global ########################################################
# create Logging 
logging.basicConfig(
    filename="sensor.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def getTimeStamp():
    now = datetime.datetime.now()
    t = ("[{0:04d}-{1:02d}-{2:02d}T{3:02d}:{4:02d}:{5:02d}.{6:03d}]".format(
        now.year, now.month, now.day, now.hour, now.minute, now.second, int(round(now.microsecond/1000, 3))))
    return t

ctrlc_received = False
# Define a signal handler for CTRL+C
def handle_ctrlc(signal, frame):
    global ctrlc_received
    ctrlc_received = True


gmxx_no2                   = 0.0
gmxx_co                    = 0.0
gmxx_no2_values            = []
gmxx_co_values             = []

hm3301_PM2_5_Atm           = 0.0
hm3301_PM10_Atm            = 0.0
hm3301_PM2_5_Atm_values    = []
hm3301_PM10_Atm_values     = []

SDS02_PM2_5                = 0.0
SDS02_PM10                 = 0.0
SDS02_PM2_5_values         = []
SDS02_PM10_values          = []

#api_co              = 0.0
#api_no2             = 0.0
#api_pm2_5           = 0.0
#api_pm10            = 0.0

################################################### Backup ########################################################
def backup_data():
    try:
        usb_path = "/media/alberding/48FB-33B2/Sensoren"
        if os.path.exists(usb_path):
            logging.info("Backup gestartet.")
            shutil.copy("all_data.json", os.path.join(usb_path, "all_data.json"))
            shutil.copy("half_hour_data.json", os.path.join(usb_path, "half_hour_data.json"))
            logging.info("Backup erfolgreich abgeschlossen.")
        else:
            logging.warning("USB-Stick nicht gefunden. Backup übersprungen.")
    except Exception as e:
        logging.error(f"Fehler beim Backup: {e}")


################################################### RUN ########################################################
def readAllI2c():
    while 1:
        try: 
            global gmxx_no2
            global gmxx_no2_values        
            gmxx_no2=gmxx.read_GMx02B(1)
            gmxx_no2 != 0 and gmxx_no2_values.append(gmxx_no2)
        
            global gmxx_co
            global gmxx_co_values
            gmxx_co = gmxx.read_GMx02B(7)
            gmxx_co != 0 and gmxx_co_values.append(gmxx_co)

            hm3301_data=hm3301.readAndGet()
            global hm3301_PM2_5_Atm
            global hm3301_PM2_5_Atm_values
            hm3301_PM2_5_Atm = hm3301_data[4]
            hm3301_PM2_5_Atm != 0 and hm3301_PM2_5_Atm_values.append(hm3301_PM2_5_Atm)
        
            global hm3301_PM10_Atm
            global hm3301_PM10_Atm_values
            hm3301_PM10_Atm = hm3301_data[5]
            hm3301_PM10_Atm != 0 and hm3301_PM10_Atm_values.append(hm3301_PM10_Atm)
            time.sleep(1)  # wait for one second
        except Exception as e: 
            logging.error(f"Fehler beim Lesen von I2C-Sensoren: {e}")    

def readSerial():
    while 1:
        try: 
            value = sds021Reader.getValue()
            global SDS02_PM2_5
            global SDS02_PM2_5_values
            SDS02_PM2_5 = value[0]
            SDS02_PM2_5 != 0 and SDS02_PM2_5_values.append(SDS02_PM2_5)
        
            global SDS02_PM10
            global SDS02_PM10_values
            SDS02_PM10 = value[1]
            SDS02_PM10 != 0 and SDS02_PM10_values.append(SDS02_PM10)
        except Exception as e:
            logging.error(f"Fehler beim Lesen des SDS021-Sensors: {e}")


        
## init
signal.signal(signal.SIGINT, handle_ctrlc)

#sds021Reader = SDS021Reader.SDS021Reader('/dev/ttyAMA0')
sds021Reader = SDS011Reader.SDS021Reader('/dev/ttyUSB0')

hm3301 = Seeed_HM3301.Seeed_HM3301()
gmxx = grove_multichannel_gas_sensor.GAS_GMXXX() 

starttime = time.time() 

# Create threads serial and i2c
try:

    # serial Thread
    t1 = threading.Thread(target=readSerial)
    t1.daemon = True  # thread dies when main thread (only non-daemon thread) exits.
    t1.start()

    # i2c Thread
    t2 = threading.Thread(target=readAllI2c)
    t2.daemon = True  # thread dies when main thread (only non-daemon thread) exits.
    t2.start()
    
    # api Thread 
    #t = threading.Thread(target=readAPI)
    #t.daemon = True
    #t.start()
    logging.info("Threads erfolgreich gestartet.")    
except Exception as e:
    logging.error(f"Fehler beim Starten der Threads: {e}")




while not ctrlc_received:
    try: 
        elapsed_time = time.time() - starttime
    
        # write all data into json 
        alldata = {
            "time": getTimeStamp(), 
            "NO2": round(gmxx_no2, 3), 
            "CO": round(gmxx_co, 3), 
            "GM:PM2_5_Atm": round(hm3301_PM2_5_Atm, 3),
            "GM:PM10_Atm": round(hm3301_PM10_Atm, 3), 
            "SD:PM2_5": round(SDS02_PM2_5, 3), 
            "SD:PM10": round(SDS02_PM10, 3)
        }
        
        with open("all_data.json", "a") as outfile: 
            json.dump(alldata, outfile) 
            outfile.write("\n") 
    
        if elapsed_time >= 60*30: 
            backup_data()
            gmxx_no2_avg = round(sum(gmxx_no2_values) / len(gmxx_no2_values), 3)
            gmxx_co_avg = round(sum(gmxx_co_values) / len(gmxx_co_values), 3)
            hm3301_PM2_5_Atm_avg = round(sum(hm3301_PM2_5_Atm_values) / len(hm3301_PM2_5_Atm_values), 3)
            hm3301_PM10_Atm_avg = round(sum(hm3301_PM10_Atm_values) / len(hm3301_PM10_Atm_values), 3)
            SDS02_PM2_5_avg = round(sum(SDS02_PM2_5_values) / len(SDS02_PM2_5_values), 3)
            SDS02_PM10_avg = round(sum(SDS02_PM10_values) / len(SDS02_PM10_values), 3)            
        
            half_hour_data = {
                "time": getTimeStamp(), 
                "NO2": gmxx_no2_avg, 
                "CO": gmxx_co_avg, 
                "GM:PM2_5_Atm": hm3301_PM2_5_Atm_avg,
                "GM:PM10_Atm": hm3301_PM10_Atm_avg, 
                "SD:PM2_5": SDS02_PM2_5_avg, 
                "SD:PM10": SDS02_PM10_avg}
        
            with open("half_hour_data.json", "a") as outfile:
                json.dump(half_hour_data, outfile)
                outfile.write("\n") 
        
            gmxx_no2_values = []
            gmxx_co_values = []
            hm3301_PM2_5_Atm_values = []
            hm3301_PM10_Atm_values = []
            SDS02_PM2_5_values = []    
            SDS02_PM10_values = []
            starttime = time.time()
        time.sleep(10)
    except Exception as e:
        logging.error(f"Fehler im Hauptthread: {e}")
    
logging.info("Programm beendet.")    
print("\nProgramm beendet.")
