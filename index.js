'use strict';

const async = require('async');
const fs = require('fs');
const https = require('https');
const request = require('request');
const path = require("path");
const createReadStream = require('fs').createReadStream
const { v4: uuidv4 } = require('uuid');
const { Console } = require('console');
const sleep = require('util').promisify(setTimeout);
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

/**
 * AUTHENTICATE
 * This single client is used for all examples.
 */
const key = '';
const endpoint = '';
const lang = 'en';


const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint);
/**
 * END - Authenticate
 */

function computerVision() {
  async.series([
    async function () {

      /**
       * OCR: READ PRINTED & HANDWRITTEN TEXT WITH THE READ API
       * Extracts text from images using OCR (optical character recognition).
       */
      console.log('-------------------------------------------------');
      console.log('READ PRINTED, HANDWRITTEN TEXT AND PDF');
      console.log();


      // URL images containing printed and/or handwritten text. 
      // The URL can point to image files (.jpg/.png/.bmp) or multi-page files (.pdf, .tiff).
      //const printedTextSampleURL = 'https://image.shutterstock.com/image-vector/set-universal-hand-drawn-paint-260nw-1091983259.jpg';
      const arrayImageFromURL = [
        'https://i.pinimg.com/236x/4b/e1/a1/4be1a10a16bf443ff840f3249ead09ce--karaoke-signage.jpg',
                                    'https://bugaga.ru/uploads/posts/2016-07/1469195181_tablichki-v-zooparke-3.jpg',
                                    'https://cs14.pikabu.ru/post_img/big/2021/08/28/7/1630145546137551319.jpg',
                                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-6zsbXbLB_MHI0YO3K8mK6gU1VzcWiRyLvJ2QAn1FPMWyIBaca-ZUwrjekEGQ7BTPXBs&usqp=CAU',
                                    'https://static01.nyt.com/images/2009/03/15/nyregion/15exhaust.we.span.jpg?quality=75&auto=webp&disable=upscale',
                                    'https://www.quotessquare.com/events/wp-content/uploads/2015/11/Merry-Christmas-and-Happy-New-Year-in-Spanish.png',
                                    'https://www.mk.ru/upload/entities/2015/08/26/articlesImages/image/8c/1e/34/f5/1619023_6831749.jpg'
                                ];
      // Recognize text in printed image from a URL
      //await analyzeImageFromURL(printedTextSampleURL, readTextFromURL, printRecText);

      for (let index = 0; index < arrayImageFromURL.length; index++) {
        const element = arrayImageFromURL[index];
        await analyzeImageFromURL( element, readTextFromURL, printRecText);
      }
      // Perform read and await the result from URL
      async function readTextFromURL(client, url) {
        // To recognize text in a local image, replace client.read() with readTextInStream() as shown:
        let result = await client.read(url);
        // Operation ID is last path segment of operationLocation (a URL)
        let operation = result.operationLocation.split('/').slice(-1)[0];

        // Wait for read recognition to complete
        // result.status is initially undefined, since it's the result of read
        while (result.status !== "succeeded") { await sleep(1000); result = await client.getReadResult(operation); }
        return result.analyzeResult.readResults; // Return the first page of result. Replace [0] with the desired page if this is a multi-page file such as .pdf or .tiff.
      }

      // Prints all text from Read result
      function printRecText(readResults) {
        console.log('Recognized text:');
        for (const page in readResults) {
          if (readResults.length > 1) {
            console.log(`==== Page: ${page}`);
          }
          const result = readResults[page];
          if (result.lines.length) {
            let txt = result.lines.map(l => l.words.map(w => w.text).join(' ')).join(' ');
            //console.log(txt);
            translateText(lang, txt);
            for (const line of result.lines) {
              console.log(line.words.map(w => w.text).join(' '));
            }
          }
          else { console.log('No recognized text.'); }
        }
        
      }



    //   console.log(printedResult);
    //   translateText(lang, printedResult);
      /**
       * 
       * Download the specified file in the URL to the current local folder
       * 
       */
      function downloadFilesToLocal(url, localFileName) {
        return new Promise((resolve, reject) => {
          console.log('--- Downloading file to local directory from: ' + url);
          const request = https.request(url, (res) => {
            if (res.statusCode !== 200) {
              console.log(`Download sample file failed. Status code: ${res.statusCode}, Message: ${res.statusMessage}`);
              reject();
            }
            var data = [];
            res.on('data', (chunk) => {
              data.push(chunk);
            });
            res.on('end', () => {
              console.log('   ... Downloaded successfully');
              fs.writeFileSync(localFileName, Buffer.concat(data));
              resolve();
            });
          });
          request.on('error', function (e) {
            console.log(e.message);
            reject();
          });
          request.end();
        });
      }

      /**
       * END - Recognize Printed & Handwritten Text
       */
      console.log();
      console.log('-------------------------------------------------');
      console.log('End of quickstart.');

    },
    function () {
      return new Promise((resolve) => {
        resolve();
      })
    }
  ], (err) => {
    throw (err);
  });
}

computerVision();


async function analyzeImageFromURL(printedTextSampleURL, readTextFromURL, printRecText) {
    console.log('Read printed text from URL...', printedTextSampleURL.split('/').pop());
    const printedResult = await readTextFromURL(computerVisionClient, printedTextSampleURL);
    printRecText(printedResult);
}

/* This simple app uses the '/translate' resource to translate text from
one language to another. */

function translateText(language, text){
    const keyTrans = '';
    const endpointTrans = '';
    const region = 'westus2';
    let options = {
        method: 'POST',
        baseUrl: endpointTrans,
        url: 'translate',
        qs: {
          'api-version': '3.0',
          'to': [language]
        },
        headers: {
          'Ocp-Apim-Subscription-Key': keyTrans,
          'Ocp-Apim-Subscription-Region': region,
          'Content-type': 'application/json',
          'X-ClientTraceId': uuidv4()
        },
        body: [{
              'text': text
        }],
        json: true,
    };

    request(options, function(err, res, body){
        console.log(JSON.stringify(body, null, 4));
    });
};