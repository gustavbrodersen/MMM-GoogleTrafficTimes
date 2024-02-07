var self;
Module.register("MMM-GoogleTrafficTimes", {
	defaults: {
		key: "",
		mode: "driving",
		origin: "SW1A 1AA",
		destination1: "Work:SW1A 2PW",
		destination2: "",
		destination3: "",
		updateInterval: 900000,
		AvoidHighways: false,
		AvoidTolls: false,
		unitSystem: "metric",
		showSymbol: true,
		showSymbolDetails: false,
		trafficModel: "best_guess",
		language: "en-EN",
		debug: false
	},

	getStyles () {
		return ["MMM-GoogleTrafficTimes.css", "font-awesome.css"];
	},

	getScripts () {
		return [this.file("./Costants.js")];
	},

	start () {

		self = this;
		Log.info(`Starting module: ${this.name}`);

		if (this.config.key === "") {
			Log.error(`Module ${this.name}: API key not provided or valid!`);
			return;
		}
		this.times = {};

		this.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES", this.config);
		if (config.debug) Log.info(`Module ${this.name}: notification request send.`);
		setInterval(function () {
			self.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES", self.config);
			if (config.debug) Log.info(`Module ${this.name}: notification request send.`);
		}, this.config.updateInterval);
	},

	async socketNotificationReceived (notification, payload) {
		if (notification === "GET_GOOGLE_TRAFFIC_TIMES_RESPONSE") {
			if (self.config.debug) Log.info(`Module ${self.name}: notification response received.`);
			if (self.config.debug) Log.info(`Module ${self.name}: response -> ${JSON.stringify(payload)}.`);
			this.times = payload;
			this.updateDom();
		}
	},

	getContent (wrapper, destination, response, config) {
		if (self.config.debug) Log.info(`Module ${self.name}: inside getContent.`);
		var time = response.duration;
		var traffic_time = response.duration_in_traffic;
		var container = document.createElement("div");

		var firstLineDiv = document.createElement("div");
		firstLineDiv.className = "bright medium mmmtraffic-firstline";
		var secondLineDiv = document.createElement("div");
		secondLineDiv.className = "normal small mmmtraffic-secondline";

		var symbolString = this.getSymbol(config.mode);

		if (config.showSymbol) {
			var symbol = document.createElement("span");
			symbol.className = `fa fa-${symbolString} symbol`;
			firstLineDiv.appendChild(symbol);
		}

		// symbol details only with driving mode, others do not have this info
		if (this.config.mode == TravelModes.DRIVING && config.showSymbolDetails) {
			var symbolDetails = document.createElement("span");
			// let's give traffic a little gap (1 minute difference is no traffic)
			var timeWithoutTrafficWithGap = time.value + (time.value * 0, 25);
			symbolDetails.className = "fa fa-users symbol";
			if (traffic_time.value > timeWithoutTrafficWithGap) firstLineDiv.appendChild(symbolDetails);
		}

		var firstLineText = document.createElement("span");
		if (this.config.mode == TravelModes.DRIVING) firstLineText.innerHTML = traffic_time.text;
		else firstLineText.innerHTML = time.text;
		firstLineDiv.appendChild(firstLineText);
		container.appendChild(firstLineDiv);

		secondLineDiv.innerHTML = destination;
		container.appendChild(secondLineDiv);
		wrapper.innerHTML += container.innerHTML;
	},

	getDestinationName (destination) {
		return destination.split(":")[0];
	},

	getDestinationNames (config) {
		var names = [];
		var name = this.getDestinationName(config.destination1);
		names.push(name);
		if (config.destination2 !== undefined && config.destination2 !== "") {
			name = this.getDestinationName(config.destination2);
			names.push(name);
		}
		if (config.destination3 !== undefined && config.destination3 !== "") {
			name = this.getDestinationName(config.destination3);
			names.push(name);
		}
		return names;
	},

	getSymbol (mode) {
		var symbolString = TravelSymbols.CAR;
		if (mode == TravelModes.CYCLING) symbolString = TravelSymbols.BICYCLE;
		if (mode == TravelModes.WALKING) symbolString = TravelSymbols.WALKING;
		return symbolString;
	},

	// Override dom generator.
	getDom () {
		var self = this;
		if (self.config.debug) Log.info(`Module ${self.name}: inside getDom.`);

		var wrapper = document.createElement("div");
		var response = self.times;
		if (response["rows"] !== undefined) {
			var names = self.getDestinationNames(self.config);
			var results = response["rows"][0]["elements"];
			for (var j = 0; j < results.length; j++) {
				self.getContent(wrapper, names[j], results[j], self.config);
			}
		}
		return wrapper;
	}
});
