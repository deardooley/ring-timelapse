FROM node:14.16 AS BUILD_IMAGE

# install node-prune
RUN curl -sf https://gobinaries.com/tj/node-prune | bash -s -- -b /usr/local/bin

WORKDIR /work

COPY . /work/

# install 
RUN npm install 

# build
RUN npm run build

# remove development dependencies
RUN npm prune --production

# run node prune
RUN /usr/local/bin/node-prune

FROM node:14.16-alpine

# add ffmpeg
RUN apk add  --no-cache ffmpeg

ENV TOKEN=$TOKEN 
# ENV CRON_SCHEDULE="*/1 * * * *"
ENV CRON_SCHEDULE="*/5 * * * *"
ENV CRON_SCHEDULE_TIMELAPSE="0 7 * * *"

WORKDIR /app

# copy from build image
COPY --from=BUILD_IMAGE /work/dist ./dist
COPY --from=BUILD_IMAGE /work/node_modules ./node_modules
COPY --from=BUILD_IMAGE /work/package.json .

# Create the cron log
RUN touch /var/log/cron.log

# Setup our start file
COPY ./cron/run.sh /tmp/run.sh
RUN chmod +x /tmp/run.sh 

CMD ["/tmp/run.sh"]
