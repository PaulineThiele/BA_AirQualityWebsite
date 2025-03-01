#!/usr/bin/python
#
# Grove - Multichannel Gas Sensor V2
# Sensoren:
# GM-102B NO2
# GM-302B C2H5CH
# GM-502B VOC
# GM-702B CO
#



from smbus2 import SMBus , i2c_msg
import time

## config
#mgs_GM_VERF         = 5
MGS_GM_VERF          = 3.3
MGS_GM_RESOLUTION    = 1023
MGS_DATA_CNT         = 4
MGS_NO2              = 1
MGS_C2H5CH           = 3
MGS_VOC              = 5
MGS_CO               = 7

MGS_GM_BUS_NR        = 1
MGS_DEFAULT_I2C_ADDR = 0x08
MGS_GM_102B          = 0x01 # No2
MGS_GM_302B          = 0x03 # C2H5CH
MGS_GM_502B          = 0x05 # VOC
MGS_GM_702B          = 0x07 # CO
MGS_CHANGE_I2C_ADDR  = 0x55
MGS_WARMING_UP       = 0xFE
MGS_WARMING_DOWN     = 0xFF


class GAS_GMXXX(object):
    def __init__(self):
        self.isPreheated = 0
        self.adress      = MGS_DEFAULT_I2C_ADDR
        self.bus_nr      = MGS_GM_BUS_NR


    def i2cReadWrite(self, valRW):
        try:
            with SMBus(self.bus_nr) as bus:
                bus.i2c_rdwr(valRW)
            # return valRW
        except:
            valRW = [0, 0, 0, 0]

    # warmming up the gas sensor
    def preheated(self):
        write = i2c_msg.write(self.adress,[MGS_WARMING_UP])
        print("preheated:", write)
        self.i2cReadWrite(write)
        self.isPreheated = 1

    # warmming up the gas sensor
    def unPreheated(self):
        write = i2c_msg.write(self.adress,[MGS_WARMING_DOWN])
        self.i2cReadWrite(write)
        self.isPreheated = 0

    # calculate volume 
    def calcVol(self, adc):
        return ((adc * MGS_GM_VERF) / (MGS_GM_RESOLUTION * 1.0))

    # change the I2C address of gas sonsor
    def changeGMXXXAddr(self, address):
        write = i2c_msg.write(self.adress,[MGS_CHANGE_I2C_ADDR, address])
        print("changeGMXXXAddr:", write)
        #self.i2cReadWrite(write)
        self.adress = adress

    # read 1:NO2, 3:C2H5CH, 5:VOC, 7:CO Sensor
    def read_GMx02B(self, sensor):
        if(self.isPreheated) != 0:
            preheated()

        volume = 0
        if(sensor == MGS_NO2): # 1
            sName="NO2"
            s=MGS_GM_102B

        elif(sensor == MGS_C2H5CH): # 3
            sName="C2H5CH"
            s=MGS_GM_302B

        elif(sensor == MGS_VOC): # 5
            sName="VOC"
            s=MGS_GM_502B

        else:             # 7
            sName="CO"
            s=MGS_GM_702B

        # print("bus:", self.bus_nr, " addr:", self.adress, "Sensor:", s, "/",sName)
        with SMBus(1) as bus:
            write = i2c_msg.write(self.adress,[s])
            self.i2cReadWrite(write)
            read = i2c_msg.read(self.adress,MGS_DATA_CNT)
            self.i2cReadWrite(read)
            data = list(read)
            volume = ((data[0] << 0) | (data[1] << 8) | (data[2] << 16) | (data[3] << 24))
            # print("read:", data)

            # print(sName, ":", volume, " = ", mgs_calcVol(volume), " V")
        return self.calcVol(volume)










def main():
    print("################### NOTICE!!!! ############################")
    print("####### Please set the I2c speed to 20khz              ####")
    print("####### sudo vim /boot/config.txt                      ####")
    print("####### add content : dtparam=i2c_arm_baudrate=20000   ####")
    print("####### sudo reboot                                    ####")
    print("################### NOTICE!!!! ############################")
    print(" ")
    print(" ")
    print(" ")

    gms = GAS_GMXXX()
    time.sleep(.1)

    while 1:
        print(
        "NO2={0:0.4f},".format(round(gms.read_GMx02B(MGS_NO2),     4)),
        "C2H5CH={0:0.4f},".format(round(gms.read_GMx02B(MGS_C2H5CH),  4)),
        "VOC={0:0.4f},".format(round(gms.read_GMx02B(MGS_VOC),     4)),
        "CO={0:0.4f}".format(round(gms.read_GMx02B(MGS_CO),      4)),
        )
        time.sleep(1)


if __name__ == '__main__':
    main()




