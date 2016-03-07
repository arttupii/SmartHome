#!/bin/sh
rm public/water.jpg > /dev/null
fswebcam --delay 2 --set framerate=5    -r 640x480 --no-banner -q   -d /dev/video0 --rotate 180 public/water.jpg

cd lib/dialEye/
nice -n 19 python dialEye.py -s meter ../../public/water.jpg

