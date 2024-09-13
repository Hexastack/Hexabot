#!/bin/sh
while :; do
    # Optional: Instead of sleep, detect config changes and only reload if necessary.
    sleep 6h
    nginx -t && nginx -s reload
done &
