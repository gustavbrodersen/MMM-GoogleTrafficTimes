const NodeHelper = require("node_helper");
const Log = require("logger");
const Constants = require("./Constants");
const ScheduleHelper = require("./ScheduleHelper");
const request = require("request");
require("dotenv").config({ path: __dirname + "/../../.env" });

const apiKey = process.env.GOOGLE_MAPS_PLATFORM_API_KEY;

module.exports = NodeHelper.create({
  start() {
    Log.info(`Starting node_helper for module: ${this.name}`);
  },

  async socketNotificationReceived(notification, payload) {
    if (notification === "GET_GOOGLE_TRAFFIC_TIMES") {
      this.config = payload;
      if (this.config.debug) Log.info(`Module ${this.name}: notification request received.`);
      const times = await this.getTrafficTimes(this.config);
      this.sendResponse(times, this.config);
    }
  },

  async getTrafficTimes(config) {
    if (config.debug) Log.info(`Module ${this.name}: inside getTrafficTimes method.`);

    const responseElements = [];
    const groupedDestinations = this.groupByModeHighwaysTolls(this.config.destinations);

    const requestPromises = Object.keys(groupedDestinations).map(async (key) => {
      const [mode, avoidHighways, avoidTolls] = key.split("_");
      const destinationsByKey = groupedDestinations[key];

      const destinationsToShow = destinationsByKey.filter(destination =>
        ScheduleHelper.isDestinationToCalculate(config.debug, destination)
      );

      for (const dest of destinationsToShow) {
        const origin = encodeURIComponent(this.config.origin.address);
        const destination = encodeURIComponent(dest.address);
        const travelMode = dest.mode || "driving";

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${travelMode}&key=${apiKey}`;

        if (config.debug) Log.info(`Module ${this.name}: Calling API for ${dest.name}`);

        await new Promise((resolve) => {
          request({ url, json: true }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              const leg = body.routes?.[0]?.legs?.[0];
              if (leg) {
                const fullResponse = {
                  destination: dest,
                  googleResponse: {
                    distanceMeters: leg.distance?.value,
                    durationTime: leg.duration?.value,
                    durationTrafficTime: leg.duration_in_traffic?.value || leg.duration?.value,
                    distanceText: leg.distance?.text,
                    durationText: leg.duration?.text,
                    durationTrafficTimeText: leg.duration_in_traffic?.text || leg.duration?.text
                  }
                };
                responseElements.push(fullResponse);
                if (config.debug) Log.info(`Module ${this.name}: response for ${dest.name} -> ${JSON.stringify(fullResponse)}.`);
              } else {
                Log.warn(`Module ${this.name}: No route found for ${dest.name}`);
              }
            } else {
              Log.error(`Module ${this.name}: API error for ${dest.name} -> ${error || body}`);
            }
            resolve();
          });
        });
      }
    });

    await Promise.all(requestPromises);
    if (config.debug) Log.info(`Module ${this.name}: response complete -> ${JSON.stringify(responseElements)}.`);
    return responseElements;
  },

  sendResponse(response, config) {
    if (config.debug) Log.info(`Module ${this.name}: sending response`);
    this.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES_RESPONSE", response || []);
  },

  groupByModeHighwaysTolls(data) {
    const grouped = {};
    data.forEach(item => {
      if (!item.mode || item.mode.trim() === "") {
        item.mode = Constants.TravelModes.DRIVE;
      }
      const mode = item.mode;
      const avoidHighways = item.avoidHighways ?? false;
      const avoidTolls = item.avoidTolls ?? false;
      const key = `${mode}_${avoidHighways}_${avoidTolls}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  }
});