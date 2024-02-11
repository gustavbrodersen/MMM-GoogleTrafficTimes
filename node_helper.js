const NodeHelper = require("node_helper");
const { Client } = require("@googlemaps/google-maps-services-js");
const Log = require("logger");
const Restrictions = require("./Costants");

module.exports = NodeHelper.create({
	start () {
		Log.info(`Starting node_helper for module: ${this.name}`);
	},

	async socketNotificationReceived (notification, payload) {
		if (notification === "GET_GOOGLE_TRAFFIC_TIMES") {
			this.config = payload;
			if (config.debug) Log.info(`Module ${this.name}: notification request received.`);
			const times = await this.getTrafficTimes(this.config);
			this.sendResponse(times, this.config);
		}
	},

	async getTrafficTimes (config) {
		if (config.debug)Log.info(`Module ${this.name}: inside getTrafficTimes method.`);

		const client = new Client({});

		var destinations = this.getDestinations(config);

		var avoid = [];
		if (config.avoidHighways) avoid.push(Restrictions.AVOID_HIGHWAYS);
		if (config.avoidTolls) avoid.push(Restrictions.AVOID_TOLLS);

		var request = { key: config.key,
			origins: [config.origin],
			destinations: destinations,
			mode: config.mode,
			departure_time: new Date(Date.now()),
			traffic_model: config.trafficModel,
			unitSystem: config.unitSystem,
			avoid: avoid,
			language: config.language };

		var response = await client.distancematrix({ params: request,
			timeout: 1000 }).then((response) => {
			response.data.rows[0].elements.forEach((element) => {
				if (config.debug) Log.info(`Module ${this.name}: response -> ${JSON.stringify(element)}.`);
			});
			return response;
		}).catch((error) => {
			Log.info(error.response.data.error_message);
		});
		return response;
	},

	sendResponse (response, config) {
		if (config.debug) Log.info(`Module ${this.name}: notification response send.`);
		this.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES_RESPONSE", response.data);
	},

	getDestinationAddress (destination) {
		return destination.address;
	},

	getDestinations (config) {
		var destinations = [];
		config.destinations.forEach((destination) => {
			destinations.push(this.getDestinationAddress(destination));
		});
		return destinations;
	}
});
