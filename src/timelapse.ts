// Copyright (c) Wictor Wilén. All rights reserved. 
// Licensed under the MIT license.

import {writeFileSync, rmSync, readdirSync, createWriteStream, readFileSync, lstatSync, statSync} from 'fs';
import * as path from 'path'
import FfmpegCommand from 'fluent-ffmpeg';
const { IncomingWebhook } = require('@slack/webhook');
var JSZip = require("jszip");

const url = process.env.SLACK_WEBHOOK_URL;
// Initialize with defaults
const webhook = new IncomingWebhook(url, {
    icon_emoji: ':camera:',
});

async function timelapse() {
    const tlts = new Date().toISOString().replace(':','_',).replace(':','_',);
    const folders = readdirSync(path.resolve(__dirname, "target"));
    folders.forEach(f => {
        if (lstatSync(path.resolve(__dirname, "target", f)).isDirectory()) {
            console.log(f);

            let command = FfmpegCommand();

            let template = "";
            const files = readdirSync(path.resolve(__dirname, "target", f));
            const templateFilePath = path.resolve(__dirname, "target", f + "-" + tlts + '.txt');
            const timelapseFilePath = path.resolve(__dirname, "target", f + "-" + tlts + '.mp4');
            const archiveFilePath = path.resolve(__dirname, "target", f + "-" + tlts + '.zip');


            command.on('error', (err) => {
                console.log('An error occurred: ' + err.message);
                slackError(`Failed creating ${f} camera timelapse`);
            });

            // Cleanup commands once timelapse is done
            command.on('end', () => {
                console.log(`Done merging ${f} camera snapshots. Creating daily archive.`);

                // clea up the ffmpeg command file
                rmSync(templateFilePath);

                // create zip archive for the timelapsed images we just calculated
                var zip = new JSZip();
                for (const file of files) {
                    // rmSync(path.resolve(__dirname, "target", f, file));
                    const snapshotFilePath = path.resolve(__dirname, "target", f, file);
                    const snapshotStat = statSync(snapshotFilePath);

                    console.log(`Timestamp of file ${snapshotFilePath} is ` + snapshotStat.ctime.toISOString());
                    console.log(`Timestamp of file ${snapshotFilePath} is ` + snapshotStat.ctimeMs);
                    console.log(snapshotStat);
                    // add file to zip archive
                    zip.file(file, readFileSync(snapshotFilePath), {
                        date: snapshotStat.ctime
                    });
                }

                zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
                   .pipe(createWriteStream(archiveFilePath))
                   .on('finish', function () {
                       console.log(`Done archiving ${f} camera snapshots!`);
                       slackError(`New timelapse available for camera ${f}`);
                       // remove the files for the next day's snapshots
                       for (const file of files) {
                           rmSync(path.resolve(__dirname, "target", f, file));
                       }
                   })
                   .on('error', function() {
                       console.log(`Error archiving ${f} camera snapshots`);
                       slackError(`Error archiving ${f} camera shapshots`);
                   });
            });

            // add all the image files
            for (const file of files.sort((a, b) => {
                return lstatSync(path.resolve(__dirname, "target", f, a)).mtimeMs -
                    lstatSync(path.resolve(__dirname, "target", f, b)).mtimeMs;
            })) {
                console.log(`Adding ${file}`);
                template += `file ${path.resolve(__dirname, "target", f, file)}\n`;
            }

            // add the last file on additional time
            template += `file ${path.resolve(__dirname, "target", f, files[files.length - 1])}\n`;
            
            // write the template file to disk
            writeFileSync(templateFilePath, template);

            // configure ffmpeg
            command.fpsOutput(24);
            command.addInput(templateFilePath);
            command.inputOptions(["-f", "concat", "-safe", "0"])
            command.videoCodec("libx264")
            command.noAudio()
            command.format("mp4");

            // persist the file
            command.save(timelapseFilePath);
        }
    });

}

// Send the notification
async function slackError(msg: String) {
    await webhook.send({
        text: msg,
    });
}

timelapse();

