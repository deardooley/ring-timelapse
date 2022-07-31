#!/bin/sh

# Setup the cron job to
echo "$CRON_SCHEDULE cd /app && date && timeout 30s npm run snapshot" >> /etc/crontabs/root
echo "$CRON_SCHEDULE_TIMELAPSE cd /app && date && timeout 120s npm run timelapse" >> /etc/crontabs/root

crond -L /var/log/cron.log && tail -f /var/log/cron.log