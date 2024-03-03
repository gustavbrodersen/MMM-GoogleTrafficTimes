# Module: Google Traffic Times

A module for the MagicMirror that displays driving times from a location to one or more destinations based on Google Maps Traffic information. As it uses the times in traffic the values are dynamic as long as there is reasonaby accurate traffic detail available to Google in your area.
The results are displayed in response bubbles which have a white circle as long as the travel time in traffic is the same or shorter than the equivalent Google holds excluding traffic data. If the in traffic travle time is longer then th circle border changes to red in order to quickly identify the increased travel time.

# Table of contents
- [Installation](#installation)
- [Using the module](#using-the-module)
- [Google API Key](#google-api-key)
- [Offset Time](#offset-time)
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
                destinations: [
			        {
			        	name: "Work",
			        	address: "SW1A 2PW"
			        },
			        {
			        	name: "Gym",
			        	address: "XXX"
			        }
		        ],
                updateInterval: 900000,
                avoidHighways: false,
                avoidTolls: false,
                mode: 'driving',
                language: "en-EN",
                offsetTime: 25,
		        lastUpdate: true,
		        timeLastUpdateWarning: 1,
                debug: false
            },
        }
    ]
}
```
* `key`: Your Google API key as described in the relevant section of this readme
* `origin`: This is the location all travel times to the destinations below will be measured from.
* `destinations`: Those are the locations you need travel times to (min 1, max 20).
* `updateInterval`: Time (in milliseconds) before refreshing data. Default: 900000 -> 15 minutes.
* `avoidHighways`: true or false, controls whether Highways are avoided (true) or utilised (false) in routing.
* `avoidTolls`: true or false, controls whether Tolls are avoided (true) or utilised (false) in routing.
* `mode`: The mode of transport to use when calculating directions, `driving` (default), `cycling` or `walking` (requests cycling/walking directions via bicycle paths/pedestrian paths - where available)
* `language`: Set languages, default `en-EN`. (`fr-FR`, `de-DE`, `it-IT`)
* `offsetTime`: Percentage to decide if there is traffic and show symbol. See paragraph to undestand logic and edit properly.
* `lastUpdate`: true or false, shows a warning message if data is not updated.
* `timeLastUpdateWarning`: Specifies time (in minutes) that have to elapse since last failed data update to display the warning message. (Default 1 minute.)
* `debug`: true or false, shows logs on console (node_helper -> backend, module -> browser).

The Destinations need to be entered in the form
```javascript
[
    {
       	name: "Work",
       	address: "SW1A 2PW"
    }
]
```
In the example config for Destination 1 we have a Label of Work with an Address of SW1A 2PW.

The Label `name` appears as the title for each result as shown in the Example Screenshot below.

In this release the origin and destination addresses have been tested across a large number of countries but certainly not all.

Whilst the Google API can accept a multitude of formats from addresses to lat&long co-ordinates this script has some matching code to make the results format nicely and this could have issues with an as yet untried address format.

# Google API Key
In order to use this module you will need a Google Maps API which is available from the Google GCP console.
You will need to enable the following APIs for your key, Maps JavaScript API, Geocoding API, Distance Matrix API.

# Offset Time
To determine if the road is busy or not, I decided to add the optimal time (meaning without traffic by Google Matrix) with an offset obtained using this simple formula:
`optimalTime + (optimalTime * offset)`
If the estimated time from Google Matrix is greater than this value, it means there is traffic, and the symbol is displayed.
By default, the offset is set to 25%, which seems like a good compromise.

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

* Warning message update

![alt text](https://github.com/Jacopo1891/MMM-GoogleTrafficTimes/blob/master/screen/05-last_update.png)

# Suggestions
Please feel free to raise an issue on GitHub for any features you would like to see or usage issues you experience and I will endeavour to address them.

# Buy me a coffee
Find it useful? Please consider buying me or other contributors a coffee.

<a href="https://www.buymeacoffee.com/jacopo1891d">
<img style="height: 51px; width: 181px; max-width: 100%;" alt="blue-button" src="https://github.com/Jacopo1891/MMM-GoogleTrafficTimes/assets/5861330/43f41b8d-13e5-4711-877d-cab090bc56b0">
</a>

