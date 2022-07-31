// Copyright (c) Wictor Wilén. All rights reserved. 
// Licensed under the MIT license.

import { writeFile, mkdirSync, existsSync } from 'fs';
import { RingApi } from 'ring-client-api'
import * as path from 'path'
import * as dotenv from "dotenv";
import * as lodash from "lodash";
const { IncomingWebhook } = require('@slack/webhook');

const log = console.log;

const url = process.env.SLACK_WEBHOOK_URL;
// Initialize with defaults
const webhook = new IncomingWebhook(url, {
    icon_emoji: ':camera:',
});

async function snapshot() {
    log("running snapshot")
    const ringApi = new RingApi({
        refreshToken: process.env.TOKEN as string,
        debug: true // false
    });

    const cameras = await ringApi.getCameras();

    if (!existsSync(path.resolve(__dirname, "target"))) {
        log("creating target");
        mkdirSync(path.resolve(__dirname, "target"));
    }

    cameras.forEach(camera => {
        const name = lodash.camelCase(camera.name);
        if (name !== 'frontDoor') {
            log(`Retrieving snapshot for ${camera.name}`);

            camera.getSnapshot().then(function (result) {
                try {
                    log((path.resolve(__dirname, "target", name)));
                    if (!existsSync(path.resolve(__dirname, "target", name))) {
                        mkdirSync(path.resolve(__dirname, "target", name));
                    }
                    writeFile(path.resolve(__dirname, "target", path.join(name, Date.now() + '.png')), result, (err) => {
                        if (err) throw err;
                        log('Saved!');
                    });
                } catch (err) {
                    log(`Error: ${err}`);
                    slackError(`Failed saving snapshot from camera ${camera.name}: ${err.message}`);
                }

            }).catch(err => {
                log(`Snapshot error: ${err}`);
                slackError(`Failed fetching snapshot from camera ${camera.name}: ${err.message}`);
                slackError(err);
            })
        } else {
            log(`Skipping snapshot for ${camera.name}`);
        }
    });
}

// Send the notification
async function slackError(msg: String) {
    await webhook.send({
        text: msg,
    });
}

dotenv.config();

snapshot()