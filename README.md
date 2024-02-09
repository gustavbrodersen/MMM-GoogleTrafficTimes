# Module: Google Traffic Times

A module for the MagicMirror that displays driving times from a location to one or more destinations based on Google Maps Traffic information. As it uses the times in traffic the values are dynamic as long as there is reasonaby accurate traffic detail available to Google in your area.
The results are displayed in response bubbles which have a white circle as long as the travel time in traffic is the same or shorter than the equivalent Google holds excluding traffic data. If the in traffic travle time is longer then th circle border changes to red in order to quickly identify the increased travel time.

# Table of contents
- [Installation](#installation)
- [Using the module](#using-the-module)
- [Google API Key](#google-api-key)
- [Debug](#debug)
- [Example Screenshot](#example-screenshot)
- [Suggestions](#suggestions)
- [Buy me a coffee](#buy-me-a-coffee)


# Installation
Navigate into your MagicMirror's ~/MagicMirror/modules folder and execute
```bash 
git clone https://github.com/Jacopo1891/MMM-GoogleTrafficTimes.git 
```
A new folder will be created, please navigate into it. Once in ~/MagicMirror/modules/MMM-GoogleTrafficTimes run:
```bash 
npm install
```
to install the module and dependencies.

# Using the module
To use this module, add it to the modules array in the config/config.js file:
```JavaScript
var config = {
    modules: [
        {
            module: 'MMM-GoogleTrafficTimes',
            position: 'top_left',
            config: {
                key: 'YOUR_KEY',
                origin: 'SW1A 1AA',
                destination1: 'Work:SW1A 2PW',
                destination2: 'Gym:XXX',
                destination3: 'Beach:XXX',
                AvoidHighways: false,
                AvoidTolls: false,
                mode: DRIVING,
                language: "en-EN",
                debug: false
            },
        }
    ]
}
```
* `key`: your Google API key as described in the relevant section of this readme
* `origin`: This is the location all travel times to the destinations below will be measured from.
* `destination1`: This is the first location you need travel times to (required).
* `destination2`: This is the second location you need travel times to (optional).
* `destination3`: This is the third location you need travel times to (optional).
* `AvoidHighways`: true or false, controls whether Highways are avoided (true) or utilised (false) in routing.
* `AvoidTolls`: true or false, controls whether Tolls are avoided (true) or utilised (false) in routing.
* `mode`: The mode of transport to use when calculating directions, `DRIVING` (default), `cycling` or `walking` (requests cycling/walking directions via bicycle paths/pedestrian paths - where available)
* `language`: Set languages, default `en-EN`. (`fr-FR`, `de-DE`, `it-IT`)
* `debug`: true or false, shows logs on console (node_helper -> backend, module -> browser).

The Destinations need to be entered in the form Label:Address.

In the example config above for Destination 1 we have a Label of Work with an Address of SW1A 2PW.

The Label appears as the title for each result bubble as shown in the Example Screenshot below.

In this release the origin and destination addresses have been tested across a large number of countries but certainly not all.

Whilst the Google API can accept a multitude of formats from addresses to lat&long co-ordinates this script has some matching code to make the results format nicely and this could have issues with an as yet untried address format.

# Google API Key
In order to use this module you will need a Google Maps API which is available from the Google GCP console.
You will need to enable the following APIs for your key, Maps JavaScript API, Geocoding API, Distance Matrix API.

# Debug
1. Stop any running instance of MagicMirror2.
2. Make sure you are in the main directory of your project.
3. Set `debug: true` on config.js as described in installation section.
3. Execute the following command to start to see all logs.
```bash 
npm start dev
```
or
```bash 
npm start dev | grep MMM-GoogleTrafficTimes
```
to see only MMM-GoogleTrafficTimes's logs.

# Example Screenshot
* Minimal

![alt text](https://github.com/Jacopo1891/MMM-GoogleTrafficTimes/blob/master/screen/01-minimal_look.png)

* Default

![alt text](https://github.com/Jacopo1891/MMM-GoogleTrafficTimes/blob/master/screen/02-default_look.png)

* Multiple

![alt text](https://github.com/Jacopo1891/MMM-GoogleTrafficTimes/blob/master/screen/03-multiple.png)

* Details (with traffic)

![alt text](https://github.com/Jacopo1891/MMM-GoogleTrafficTimes/blob/master/screen/04-details.png)

# Suggestions
Please feel free to raise an issue on GitHub for any features you would like to see or usage issues you experience and I will endeavour to address them.

# Buy me a coffee
Find it useful? Please consider buying me or other contributors a coffee.

<a href="https://www.buymeacoffee.com/jacopo1891d">
<img style="height: 51px; width: 181px; max-width: 100%;" alt="blue-button" src="https://github.com/Jacopo1891/MMM-GoogleTrafficTimes/assets/5861330/43f41b8d-13e5-4711-877d-cab090bc56b0">
</a>

