#!/bin/sh

sudo -v

curl -Lo /Library/Fonts/fira.zip $(curl -s https://api.github.com/repos/tonsky/FiraCode/releases/latest | grep browser_download_url | head -n 1 | cut -d '"' -f 4)

unzip /Library/Fonts/fira.zip

