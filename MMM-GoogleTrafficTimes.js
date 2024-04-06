var self;
Module.register("MMM-GoogleTrafficTimes", {
	defaults: {
		key: "",
		mode: "driving",
		origin: "SW1A 1AA",
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
		unitSystem: "metric",
		showSymbol: true,
		showSymbolDetails: false,
		trafficModel: "best_guess",
		language: "en-EN",
		offsetTime: 25,
		lastUpdate: true,
		timeLastUpdateWarning: 1,
		horizontalLayout: false,
		schedules: [],
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
		this.config.mode = this.config.mode.toLowerCase();
		if (this.config.key === "") {
			Log.error(`Module ${this.name}: API key not provided or valid!`);
			return;
		}
		if (this.config.destinations === "" || this.config.destinations.length == 0) {
			Log.error(`Module ${this.name}: destinations not provided or valid!`);
			return;
		}
		this.times = {};
		this.time = "";

		if (self.isScheduledNow()) {
			this.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES", this.config);
			if (self.config.debug) Log.info(`Module ${this.name}: notification request send.`);
			setInterval(function () {
				self.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES", self.config);
				if (self.config.debug) Log.info(`Module ${this.name}: notification request send.`);
			}, this.config.updateInterval);
		}
	},

	isScheduledNow () {
		if (self.config.schedules && self.config.schedules.length === 0) return true;
		var now = new Date();
		var currentDay = now.getDay();
		var currentHour = now.getHours();
		var currentMinute = now.getMinutes();

		for (var item of self.config.schedules) {
			if (item.days.includes(currentDay)) {
				const startHH = item.startHH === null || item.startHH === undefined || item.startHH === "" ? null : parseInt(item.startHH);
				const startMM = item.startMM === null || item.startMM === undefined || item.startMM === "" ? null : parseInt(item.startMM);
				const endHH = item.endHH === null || item.endHH === undefined || item.endHH === "" ? null : parseInt(item.endHH);
				const endMM = item.endMM === null || item.endMM === undefined || item.endMM === "" ? null : parseInt(item.endMM);

				if ((startHH === null && endHH === null)
				  || (startHH === null && currentHour < endHH)
				  || (endHH === null && currentHour > startHH)
				  || ((currentHour > startHH || (currentHour === startHH && currentMinute >= startMM))
				  && (currentHour < endHH || (currentHour === endHH && currentMinute < endMM)))
				) return true;
			}
		}
		if (self.config.debug) Log.info(`Module ${self.name}: now is not in schedules.`);
		return false;
	},

	async socketNotificationReceived (notification, payload) {
		if (notification === "GET_GOOGLE_TRAFFIC_TIMES_RESPONSE") {
			if (self.config.debug) Log.info(`Module ${self.name}: notification response received.`);
			if (self.config.debug) Log.info(`Module ${self.name}: response -> ${JSON.stringify(payload)}.`);

			if (self.checkResponseIsOk(payload))
			{
				self.times = payload;
				self.timeLastUpdate = new Date();
			}
			self.updateDom();
		}
	},

	getLastHHMM () {
		let hour = self.timeLastUpdate.getHours();
		let minute = self.timeLastUpdate.getMinutes();
		return `${self.formatTimeUnit(hour)}:${self.formatTimeUnit(minute)}`;
	},

	formatTimeUnit (unit) {
		return unit.toString().padStart(2, "0");
	},

	getContent (wrapper) {
		if (self.checkResponseIsOk(self.times)) {
			var names = self.getDestinationNames(self.config);
			var results = self.times["rows"][0]["elements"];
			for (var j = 0; j < results.length; j++) wrapper.innerHTML += self.getDestinationContent(names[j], results[j]);
		}
		if (self.config.lastUpdate && self.isTimesOld()) wrapper.innerHTML += self.getLastUpdateContent();
	},

	getDestinationContent (destination, response) {
		if (self.config.debug) Log.info(`Module ${self.name}: inside getDestinationContent.`);
		if (response.status != "OK") {
			Log.error(`Module ${self.name}: destination ${destination}, status = ${response.status}`);
			return; }

		var time = response.duration;
		var traffic_time = response.duration_in_traffic;
		var wrapper = document.createElement("div");
		var container = document.createElement("div");
		container.className = "mmmtraffic-container";

		var firstLineDiv = document.createElement("div");
		firstLineDiv.className = "bright medium mmmtraffic-firstline";
		var secondLineDiv = document.createElement("div");
		secondLineDiv.className = "normal small mmmtraffic-secondline";

		var symbolString = this.getSymbol(self.config.mode);

		if (self.config.showSymbol) {
			var symbol = document.createElement("span");
			symbol.className = `fa fa-${symbolString} symbol`;
			firstLineDiv.appendChild(symbol);
		}

		// symbol details only with driving mode, others do not have this info
		if (self.config.debug) Log.info(`Module ${this.name}: showSymbolDetails ${self.config.showSymbolDetails}.`);
		if (self.config.mode == TravelModes.DRIVING && self.config.showSymbolDetails) {
			var symbolDetails = document.createElement("span");
			// let's give traffic a little gap (1 minute difference is no traffic)
			var timeWithoutTrafficWithGap = time.value + (time.value * (self.config.offsetTime / 100));
			symbolDetails.className = "fa fa-users symbol";
			if (self.config.debug) Log.info(`Module ${this.name}: traffic_time ${traffic_time.value}.`);
			if (self.config.debug) Log.info(`Module ${this.name}: timeWithoutTrafficWithGap ${timeWithoutTrafficWithGap}.`);
			if (traffic_time.value > timeWithoutTrafficWithGap) firstLineDiv.appendChild(symbolDetails);
		}

		var firstLineText = document.createElement("span");
		if (self.config.mode == TravelModes.DRIVING) firstLineText.innerHTML = traffic_time.text;
		else firstLineText.innerHTML = time.text;
		firstLineDiv.appendChild(firstLineText);
		container.appendChild(firstLineDiv);

		secondLineDiv.innerHTML = destination;
		container.appendChild(secondLineDiv);
		wrapper.appendChild(container);
		return wrapper.innerHTML;
	},

	getLastUpdateContent () {
		if (self.config.debug) Log.info(`Module ${self.name}: inside getLastUpdateContent.`);
		var container = document.createElement("div");

		var lineDiv = document.createElement("div");
		lineDiv.className = "mmmtraffic-updateline mmmtraffic-secondline";
		lineDiv.innerHTML = `Last update at: ${self.getLastHHMM()}`;
		container.appendChild(lineDiv);

		return container.innerHTML;
	},

	isTimesOld () {
		var now = new Date();
		var interval = self.config.updateInterval + (self.config.timeLastUpdateWarning * 60 * 1000);
		var timeDifference = now - self.timeLastUpdate;
		console.log(`interval: ${interval}`);
		console.log(`timeDifference: ${timeDifference}`);
		return timeDifference > interval;
	},

	getDestinationName (destination) {
		return destination.name;
	},

	getDestinationNames () {
		var names = [];
		self.config.destinations.forEach((destination) => {
			names.push(this.getDestinationName(destination));
		});

		return names;
	},

	getSymbol () {
		var symbolString = TravelSymbols.CAR;
		if (self.mode == TravelModes.CYCLING) symbolString = TravelSymbols.BICYCLE;
		if (self.mode == TravelModes.WALKING) symbolString = TravelSymbols.WALKING;
		return symbolString;
	},

	checkResponseIsOk (response) {
		return response !== undefined && response["rows"] !== undefined && response["rows"].length > 0;
	},

	// Override dom generator.
	getDom () {
		if (self.config.debug) Log.info(`Module ${self.name}: inside getDom.`);
		var wrapper = document.createElement("div");
		if (self.config.horizontalLayout) wrapper.className = "mmmtraffic-horizontaly";
		self.getContent(wrapper);
		return wrapper;
	}
});
