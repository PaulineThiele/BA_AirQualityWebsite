#!/usr/bin/python


#import os
#import sys
import time
import serial

# Set default USB port
USBPORT = "/dev/ttyAMA0"


class DEBO_GAS_MQ131:

    def __init__(self, inport, baud):
        self.serial = serial.Serial(port=inport, baudrate=baud)

    def readLine( self ):
        v = self.serial.readline()
        print("V:", v)

    def readValue( self ):
        step = 0
        while True: 
            while self.serial.inWaiting() != 0:
                v = self.serial.read(1)
                # v = ord(self.serial.read())

                print("V:", v)

                # if step == 0:
                #     if v == 170:
                #         step = 1
                #
                # elif step == 1:
                #     if v == 192:
                #         values = [0,0,0,0,0,0,0]
                #         step = 2
                #     else:
                #         step = 0
                #
                # elif step > 8:
                #     step = 0
                #     # Compute PM2.5 and PM10 values
                #     pm25 = (values[1]*256 + values[0])/10.0
                #     pm10 = (values[3]*256 + values[2])/10.0
                #     return [pm25,pm10]
                #
                # elif step >= 2:
                #     values[step - 2] = v
                #     step = step + 1


    # def read( self ):
        # species = [[],[]]

        # while 1:
        #     try:
        #         values = self.readValue()
        #         species[0].append(values[0])
        #         species[1].append(values[1])
        #         print("PM2.5: {}, PM10: {}".format(values[0], values[1]))
        #         time.sleep(1)  # wait for one second
        #     except KeyboardInterrupt:
        #         print("Quit!")
        #         sys.exit()
        #     except:
        #         e = sys.exc_info()[0]
        #         print("Can not read sensor data! Error description: " + str(e))

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


    mq131 = DEBO_GAS_MQ131(USBPORT, 115200)
    time.sleep(.1)

    while 1:
        # mq131.readValue()
        mq131.readLine()
        time.sleep(1)


if __name__ == '__main__':
    main()


# def loop(usbport):
#     print("Starting reading dust sensor on port " + usbport + "...")
#     reader = SDS021Reader(usbport)
#     while 1:
#         reader.read()
#
# if len(sys.argv)==2:
#     if sys.argv[1].startswith('/dev'):  # Valid are only parameters starting with /dev
#         loop(sys.argv[1])
#     else:
#         loop(USBPORT)
# else:
#     loop(USBPORT)
