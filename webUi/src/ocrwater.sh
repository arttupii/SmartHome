#!/bin/sh
fswebcam --delay 1  -S 60  -r 650x480 --no-banner -q   --set Brightness=70% --set Contrast=80% -d /dev/video0 --rotate 180  ./public/water.jpg
#fswebcam -S 100  -r 384x288 --no-banner -q   -d /dev/video0 --rotate 180 ../public/water.jpg

cd ./lib/dialEye/
nice -n 19 python dialEye.py -s meter ../../public/water.jpg


