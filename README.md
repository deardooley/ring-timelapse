
# Ring Timelapse generator

A Docker container that periodically takes snapshots from your [Ring](https://www.ring.com) cameras and then creates timelapse videos of the snapshots.

[![Docker Image Version (tag latest semver)](https://img.shields.io/docker/v/wictorwilen/ring-timelapse/latest)](https://hub.docker.com/repository/docker/wictorwilen/ring-timelapse)
[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/wictorwilen/ring-timelapse/blob/main/LICENSE.md)

## Features

- Takes snapshots of all Ring cameras periodically, default 15 minutes
- Creates a timelapse video periodically, default every day
- Runs as a Docker container with minimal footprint

> **NOTE**: Taking snapshots often will drain the battery faster than normal.

## Installation

In order to run the Docker container you need a Ring refresh token.
To generate the token use the following command:

``` bash
npx -p ring-client-api ring-auth-cli
```

Use the following to pull the Docker container from Docker hub.

``` bash
docker pull deardooley/ring-timelapse
```

Before starting the container, create a directory that will be shared with the 
container to persist the snapshots and timelapses, for instance:

``` bash
cd /media
mkdir timelapse
```

Start the container by running:

``` bash
docker run 
  -d 
  -e TOKEN="<insert token here>" 
  -e SLACK_INCOMING_WEBHOOK="<insert webhook url here>"
  -v "$HOME/media/timelapse:/app/dist/target" 
  --restart unless-stopped 
  deardooley/ring-timelapse
```

> **NOTE**: In the `-v` argument replace the local path (`/media/timelapse`) with the directory you created

or using the `docker-compose.yml` file.

```bash
docker-compose up -d
```

> **NOTE**: Define your TOKEN and SLACK_INCOMING_WEBHOOK variables in a `.env` file in the same directory as the compose file.

## Environment Variables

The following variables are required:

`TOKEN` - your generated Ring token, see Installation

`SLACK_INCOMING_WEBHOOK` - URL to post errors and new video notifications

The following variables are optional:

`CRON_SCHEDULE` - Schedule for taking snapshots, in [Crontab format](https://linuxhandbook.com/crontab/). Default: `*/15 * * * *`

`CRON_SCHEDULE_TIMELAPSE` - Schedule for generating the timelapse video. Default: `0 7 * * *`


## Authors

- [@wictorwilen](https://www.github.com/wictorwilen)
- [@deardooley](https://www.github.com/deardooley)
  
## License

[MIT](https://choosealicense.com/licenses/mit/)
