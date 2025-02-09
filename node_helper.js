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
		
		const responseElements = [];
		const client = new RoutesClient({ apiKey: this.config.key });
		const trafficModel = "BEST_GUESS";
		const options = {
			timeout: 10_000,
			otherArgs: {
				headers: {
					"X-Goog-FieldMask": "*"
				}
			}
		};
	
		const groupedDestinations = this.groupByModeHighwaysTolls(this.config.destinations);
		if (config.debug) Log.info(`Module ${this.name}: groupedDestinations ${JSON.stringify(groupedDestinations)}.`);
	
		// Creiamo un array di Promises per tutte le richieste
		const requestPromises = Object.keys(groupedDestinations).map(async (key) => {
			const [mode, avoidHighways, avoidTolls] = key.split("_");
			const destinationsByKey = groupedDestinations[key];

			if (config.debug) Log.info(`Module ${this.name}: destinationsByKey -> ${JSON.stringify(destinationsByKey)}.`);

			const destinations = this.getDestinationsWaypoint(destinationsByKey);
			const originWaypoint = this.getWaypoint(this.config.origin);
			
			const origin = {
				waypoint: originWaypoint.waypoint,
				routeModifiers: {
					avoidTolls: this.isModeDrive(mode) ? avoidTolls === "true" : false,
					avoidHighways: this.isModeDrive(mode) ? avoidHighways === "true" : false,
					avoidFerries: this.isModeDrive(mode) ? config.avoidFerries : false
				}
			};
	
			const request = {
				origins: [origin],
				destinations: destinations,
				travelMode: mode.toUpperCase(),
				routingPreference: this.isModeDrive(mode) ? "TRAFFIC_AWARE_OPTIMAL" : "",
				units: config.unitSystem.toUpperCase(),
				languageCode: config.language
			};
	
			// Eseguiamo la richiesta e ritorniamo una Promise
			return new Promise((resolve, reject) => {
				let index = 0; // Indice per tenere traccia delle destinazioni

				const responseStream = client.computeRouteMatrix(request, options);
	
				responseStream.on('data', (response) => {
					if (config.debug) Log.info(`Module ${this.name}: partial response -> index:${index} ${JSON.stringify(response)}.`);
					const fullResponse = {
						destination: destinationsByKey[index],
						googleResponse : this.getDataFromGoogleResponse(response), // Manteniamo i dati originali
					};
					responseElements.push(fullResponse);
					index++; // Passiamo alla destinazione successiva
				});
	
				responseStream.on('end', () => resolve());
				responseStream.on('error', (error) => {
					Log.error(`Module ${this.name}: error -> ${JSON.stringify(error.message)}.`);
					reject(error);
				});
			});
		});
	
		// Aspettiamo che tutte le richieste siano completate
		await Promise.all(requestPromises);
	
		if (config.debug) Log.info(`Module ${this.name}: response complete -> ${JSON.stringify(responseElements)}.`);
	
		return responseElements;
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

	getDestinationsWaypoint(destinationsGrouped) {
		var destinations = [];
		destinationsGrouped.forEach((destination) => {
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
	},

	groupByModeHighwaysTolls(data) {
		const grouped = {};
	
		data.forEach(item => {
			const mode = item.mode || Constants.TravelModes.DRIVE;
			const avoidHighways = item.avoidHighways ?? false;
			const avoidTolls = item.avoidTolls ?? false;
	
			const key = `${mode}_${avoidHighways}_${avoidTolls}`;	
			if (!grouped[key]) grouped[key] = [];
			grouped[key].push(item);
		});
	
		return grouped;
	},
	
	isModeDrive(mode) {
		return mode == Constants.TravelModes.DRIVE;
	},

	getDataFromGoogleResponse(response) {
		return {
			distanceMeters: response.distanceMeters,
			durationTime: response.staticDuration.seconds,
			durationTrafficTime: response.duration.seconds,
			distanceText: response.localizedValues.distance.text,
			durationText: response.localizedValues.staticDuration.text,
			durationTrafficTimeText: response.localizedValues.duration.text
		};
	}
});
