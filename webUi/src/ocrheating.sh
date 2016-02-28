#!/bin/sh

fswebcam --delay 5  -S 20  -r 640x480 --no-banner --set Brightness=80% --set Contrast=90%  -d /dev/video1 --rotate 180 ../public/heating.jpg

echo 12345
