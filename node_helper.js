const NodeHelper = require("node_helper");
const Log = require("logger");
const {RoutesClient} = require("@googlemaps/routing").v2;

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

		const client = new RoutesClient({apiKey: this.config.key});

		const destinations = this.getDestinations(config);
		const origin = {
			waypoint: {
				address: config.origin
			},
			routeModifiers: {
				avoidTolls: config.avoidTolls,
				avoidHighways: config.avoidHighways,
				avoidFerries: config.avoidFerries
			}
		};

		const request = {
			origins: [origin],
			destinations: destinations,
			travelMode: config.mode.toUpperCase(),
			routingPreference: "TRAFFIC_AWARE_OPTIMAL",
			trafficModel: config.trafficModel.toUpperCase(),
			units: config.unitSystem.toUpperCase(),
			languageCode: config.language
		};

		const options = {
			timout: 10_000,
			otherArgs: {
				headers: {
					"X-Goog-FieldMask": "*"
				}
			}
		}
		const responseStream = await client.computeRouteMatrix(request, options);
		const responseElements = [];
		responseStream.on('data', (response) => {
			if (config.debug) Log.info(`Module ${this.name}: response -> ${JSON.stringify(response)}.`);
			responseElements.push(response);
		})
		return new Promise(function (resolve, reject) {
			responseStream.on('end', () => resolve(responseElements));
			responseStream.on('error', () => {
				Log.error(`Module ${this.name}: error -> ${JSON.stringify(error.message)}.`);
				return reject;
			})
		});
	},

	sendResponse(response, config) {
		if (config.debug) Log.info(`Module ${this.name}: notification response send.`);
		if (response !== undefined) this.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES_RESPONSE", response);
		else {
			this.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES_RESPONSE", []);
			Log.info(`Module ${this.name}: response NodeHelper: error calling google api.`);
		}
	},

	getDestinationAddress(destination) {
		return destination.address;
	},

	getDestinations(config) {
		var destinations = [];
		config.destinations.forEach((destination) => {
			destinations.push({
				waypoint: {
					address: this.getDestinationAddress(destination)
				}
			});
		});
		return destinations;
	}
});
