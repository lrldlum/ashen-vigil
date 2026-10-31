#!/bin/sh
# Pull Artist's latest true-size pixel sheets into the game (filenames are the contract; no code changes needed).
cp /workspace/ashen-vigil-ss-art/sheets_pixel/*_strip.png /workspace/ashen-vigil-ss-art/sheets_pixel/spritesheets.json "$(dirname "$0")/../assets/art/sheets_pixel/"
cp /workspace/ashen-vigil-ss-art/sheets_pixel/armor/* "$(dirname "$0")/../assets/art/sheets_pixel/armor/"
