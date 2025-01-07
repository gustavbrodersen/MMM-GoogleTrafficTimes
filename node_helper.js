const NodeHelper = require("node_helper");
const Log = require("logger");
const {RoutesClient} = require("@googlemaps/routing").v2;
const Constants = require("./Constants");

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

		const destinations = this.getDestinations(this.config);
		const originWaypoint = this.getWaypoint(this.config.origin);
		const origin = {
			waypoint : originWaypoint.waypoint,
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
			timeout: 10_000,
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
			responseStream.on('error', (error) => {
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
			var waypoint = this.getWaypoint(destination)
			destinations.push({
				waypoint: waypoint.waypoint
			});
		});
		return destinations;
	},

	getWaypoint(location) {
		if (this.config.debug) Log.info(`Module ${this.name}: inside getOriginWaypoint method.`);

		if (!location.address || !location.addressFormat) Log.info(`Module ${this.name}: Missing required configuration fields.`);

		switch (location.addressFormat) {
			case Constants.OriginFormat.ADDRESS:
				return this.createAddressWaypoint(location.address);
			case Constants.OriginFormat.COORDINATES:
				return this.createCoordinatesWaypoint(location.address);
			default:
				Log.info(`Module ${this.name}: Unknown origin format '${location.originFormat}'.`);
		}
	},
	
	createAddressWaypoint(address) {
		if (this.config.debug) Log.info(`Module ${this.name}: inside createAddressWaypoint method.`);

		return {
			waypoint: {
				address: address
			}
		};
	},
	
	createCoordinatesWaypoint(coordinates) {
		if (this.config.debug) Log.info(`Module ${this.name}: inside createCoordinatesWaypoint method.`);

		const [latitude, longitude] = coordinates.split(",").map(coord => coord.trim());
		if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) Log.info(`Module ${this.name}: Invalid coordinates format.`);
		return {
			waypoint: {
				location: {
					latLng: {
						latitude: parseFloat(latitude),
						longitude: parseFloat(longitude)
					}
				}
			}
		};
	}
});
