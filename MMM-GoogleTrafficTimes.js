var self;
Module.register("MMM-GoogleTrafficTimes", {
	defaults: {
		key: "",
		mode: "drive",
		origin: {
			address: "SW1A 2PW",
			addressFormat: 'address',
		},
		originFormat: 'address',
		destinations: [
			{
				name: "Work",
				address: "SW1A 2PW",
				addressFormat: 'address',
			},
			{
				name: "Gym",
				address: "XXX",
				addressFormat: 'address',
			}
		],
		updateInterval: 900000,
		avoidHighways: false,
		avoidTolls: false,
		avoidFerries: false,
		unitSystem: "metric",
		showSymbol: true,
		showSymbolDetails: false,
		trafficModel: "best_guess",
		language: "en-EN",
		offsetTimePercentage: 25,
		lastUpdate: true,
		timeLastUpdateWarning: 1,
		horizontalLayout: false,
		schedules: [],
		showTrafficTimesOutsideOfSchedule: false,
		debug: false
	},

	getStyles() {
		return ["MMM-GoogleTrafficTimes.css", "font-awesome.css"];
	},

	getScripts() {
		return [this.file("./Constants.js")];
	},

	start() {

		self = this;
		Log.info(`Starting module: ${this.name}`);
		this.config.mode = this.config.mode.toLowerCase();
		if (this.config.key === "") {
			Log.error(`Module ${this.name}: API key not provided or valid!`);
			return;
		}
		if (this.config.destinations === "" || this.config.destinations.length === 0) {
			Log.error(`Module ${this.name}: destinations not provided or valid!`);
			return;
		}
		this.times = {};

		self.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES", this.config);
		if (self.config.debug) Log.info(`Module ${this.name}: notification request send.`);
		setInterval(function () {
			if (self.isScheduledNow()) {
				self.sendSocketNotification("GET_GOOGLE_TRAFFIC_TIMES", self.config);
				if (self.config.debug) Log.info(`Module ${this.name}: notification request send.`);
			}
		}, this.config.updateInterval);

	},

	isScheduledNow() {
		if (self.config.schedules && self.config.schedules.length === 0) return true;
		var now = new Date();
		var currentDay = now.getDay();
		var currentHour = now.getHours();
		var currentMinute = now.getMinutes();

		for (var item of self.config.schedules) {
			if (item.days.includes(currentDay) || item.days.length === 0) {
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

	async socketNotificationReceived(notification, payload) {
		if (notification === "GET_GOOGLE_TRAFFIC_TIMES_RESPONSE") {
			if (self.config.debug) Log.info(`Module ${self.name}: notification response received.`);
			if (self.config.debug) Log.info(`Module ${self.name}: response -> ${JSON.stringify(payload)}.`);

			if (self.checkResponseIsOk(payload)) {
				self.times = payload;
				self.timeLastUpdate = new Date();
			}
			self.updateDom();
		}
	},

	getLastHHMM() {
		let hour = self.timeLastUpdate.getHours();
		let minute = self.timeLastUpdate.getMinutes();
		return `${self.formatTimeUnit(hour)}:${self.formatTimeUnit(minute)}`;
	},

	formatTimeUnit(unit) {
		return unit.toString().padStart(2, "0");
	},

	getContent(wrapper) {
		if (self.checkResponseIsOk(self.times)) {
			var results = self.times;
			results.forEach(element => {
				wrapper.innerHTML += self.getDestinationContent(element.destination, element.googleResponse)
			});
		}
		if (self.config.lastUpdate && self.isTimesOld()) wrapper.innerHTML += self.getLastUpdateContent();
	},

	getDestinationContent(destination, response) {
		if (self.config.debug) Log.info(`Module ${self.name}: inside getDestinationContent.`);
		if (response.condition === "ROUTE_NOT_FOUND") {
			Log.error(`Module ${self.name}: destination ${destination}, condition = ${response.condition}, = ${response.status}`);
			return;
		}

		var timeInSeconds = parseFloat(response.durationTime);
		var timeInSecondsRightNow = parseFloat(response.durationTrafficTime);
		if (self.config.debug) Log.info(`Module ${this.name}: destination ${destination.name}, timeInSeconds ${timeInSeconds} | timeInSecondsRightNow ${timeInSecondsRightNow}.`);
		var wrapper = document.createElement("div");
		var container = document.createElement("div");
		container.className = "mmmtraffic-container";

		var firstLineDiv = document.createElement("div");
		firstLineDiv.className = "bright medium mmmtraffic-firstline";
		var secondLineDiv = document.createElement("div");
		secondLineDiv.className = "normal small mmmtraffic-secondline";

		var symbolString = this.getSymbol(destination.mode);

		if (self.config.showSymbol) {
			var symbol = document.createElement("span");
			symbol.className = `fa fa-${symbolString} symbol`;
			firstLineDiv.appendChild(symbol);
		}

		// symbol details only with driving mode, others do not have this info
		if (self.config.debug) Log.info(`Module ${this.name}: showSymbolDetails ${self.config.showSymbolDetails}.`);
		if (destination.mode === TravelModes.DRIVE && self.config.showSymbolDetails) {
			var symbolDetails = document.createElement("span");
			// let's give traffic a little gap of offsetTimePercentage before showing the traffic symbol
			var timeInSecondsWithGap = timeInSeconds + (timeInSeconds * (self.config.offsetTimePercentage / 100));
			symbolDetails.className = "fa fa-users symbol";
			if (self.config.debug) Log.info(`Module ${this.name}: destination ${destination.name}, timeInSecondsWithTraffic ${timeInSecondsRightNow} | timeInSecondsWithGap ${timeInSecondsWithGap}.`);
			if (timeInSecondsRightNow > timeInSecondsWithGap) firstLineDiv.appendChild(symbolDetails);
		}

		var firstLineText = document.createElement("span");
		if (destination.mode === TravelModes.DRIVE && self.isScheduledNow()) firstLineText.innerHTML = response.durationTrafficTimeText;
		else firstLineText.innerHTML = response.durationText;
		firstLineDiv.appendChild(firstLineText);
		container.appendChild(firstLineDiv);

		secondLineDiv.innerHTML = destination.name;
		container.appendChild(secondLineDiv);
		wrapper.appendChild(container);
		return wrapper.innerHTML;
	},

	getLastUpdateContent() {
		if (self.config.debug) Log.info(`Module ${self.name}: inside getLastUpdateContent.`);
		var container = document.createElement("div");

		var lineDiv = document.createElement("div");
		lineDiv.className = "mmmtraffic-updateline mmmtraffic-secondline";
		lineDiv.innerHTML = `Last update at: ${self.getLastHHMM()}`;
		container.appendChild(lineDiv);

		return container.innerHTML;
	},

	isTimesOld() {
		var now = new Date();
		var interval = self.config.updateInterval + (self.config.timeLastUpdateWarning * 60 * 1000);
		var timeDifference = now - self.timeLastUpdate;
		if (self.config.debug) Log.info(`Module ${self.name}:interval: ${interval}`);
		if (self.config.debug) Log.info(`Module ${self.name}:timeDifference: ${timeDifference}`);
		return timeDifference > interval;
	},

	getDestinationName(destination) {
		return destination.name;
	},

	getDestinationNames() {
		var names = [];
		self.config.destinations.forEach((destination) => {
			names.push(this.getDestinationName(destination));
		});

		return names;
	},

	getSymbol(mode) {
		if (self.config.debug) Log.info(`Module ${self.name}: inside getSymbol.`);
		var symbolString = TravelSymbols.CAR;
		if (mode === TravelModes.BICYCLE) symbolString = TravelSymbols.BICYCLE;
		if (mode === TravelModes.WALK) symbolString = TravelSymbols.WALKING;
		return symbolString;
	},

	checkResponseIsOk(response) {
		return response !== undefined && response.length > 0;
	},

	// Override dom generator.
	getDom() {
		if (self.config.debug) Log.info(`Module ${self.name}: inside getDom.`);
		var wrapper = document.createElement("div");
		if (self.config.horizontalLayout) wrapper.className = "mmmtraffic-horizontaly";
		if (self.config.showTrafficTimesOutsideOfSchedule) {
			self.getContent(wrapper);
		} else if (self.isScheduledNow()) {
			self.getContent(wrapper);
		}
		return wrapper;
	}
});
