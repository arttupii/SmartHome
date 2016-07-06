#!/bin/sh
fswebcam --delay 0  -S 10  -r 640x480 --no-banner -q   --set Brightness=60% --set Contrast=70% -d /dev/video0   ./public/water.jpg
#fswebcam -S 100  -r 384x288 --no-banner -q   -d /dev/video0 --rotate 180 ../public/water.jpg

cd ./lib/dialEye/
nice -n 19 python dialEye.py -s meter ../../public/water.jpg


