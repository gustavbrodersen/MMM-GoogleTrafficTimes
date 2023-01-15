var self;
Module.register("MMM-GoogleTrafficTimes", {
        // Module config defaults
        defaults: {
                key: "",
                mode: "DRIVING",
                origin: "SW1A 1AA",
                destination1: "Work:SW1A 2PW",
                destination2: "Gym:XXX",
                destination3: "School:XXX",
                updateInterval: 900000,
                AvoidHighways: false,
                AvoidTolls: false,
                unitSystem: "METRIC",
                showSymbol: true,
                showSymbolDetails: false,
                trafficModel: "bestguess",
        },

        getStyles: function () {
                return ["MMM-GoogleTrafficTimes.css", "font-awesome.css"];
        },

        start: function () {
                self = this;
                Log.info("Starting module: " + this.name);

                if (this.config.key === "") {
                        Log.error("MMM-GoogleTrafficTimes: API key not provided or valid!");
                        return;
                }

                setInterval(function () {
                        self.updateDom();
                }, this.config.updateInterval);
        },

        getContent: function (wrapper, destination, time, traffic_time, config) {
                var container = document.createElement("div");
                 
                // base divs
                var firstLineDiv = document.createElement('div');
                firstLineDiv.className = 'bright medium mmmtraffic-firstline';
                var secondLineDiv = document.createElement('div');
                secondLineDiv.className = 'normal small mmmtraffic-secondline';

                let symbolString = 'car';
                if (config.mode == 'cycling') symbolString = 'bicycle';
                if (config.mode == 'walking') symbolString = 'walking';
                
                // symbol
                if (config.showSymbol) {
                        var symbol = document.createElement('span');
                        symbol.className = `fa fa-${symbolString} symbol`;
                        firstLineDiv.appendChild(symbol);
                }

                // symbol details
                if (config.showSymbolDetails) {
                        var symbolDetails = document.createElement('span');
                        symbolDetails.className = `fa fa-users symbol`;
                        if(traffic_time.value > time.value)
                                firstLineDiv.appendChild(symbolDetails);
                }

                var firstLineText = document.createElement('span');
                firstLineText.innerHTML = traffic_time.text;
                firstLineDiv.appendChild(firstLineText);
                container.appendChild(firstLineDiv);

                secondLineDiv.innerHTML = destination;
                container.appendChild(secondLineDiv);
                wrapper.innerHTML += container.innerHTML;
        },

        // Override dom generator.
        getDom: function () {
                var self = this;
                var origin = this.config.origin;

                var location1 = this.config.destination1.split(":")[1];
                var location2 = this.config.destination2.split(":")[1];
                var location3 = this.config.destination3.split(":")[1];
                
                var nameList = [];
                nameList[0] = this.config.destination1.split(":")[0];
                nameList[1] = this.config.destination2.split(":")[0];
                nameList[2] = this.config.destination3.split(":")[0];

                var travelMode = "DRIVING";
                if (config.mode == 'cycling') travelMode = 'BICYCLING';
                if (config.mode == 'walking') travelMode = 'WALKING';

                var AvoidHighways = this.config.AvoidHighways;
                var AvoidTolls = this.config.AvoidTolls;
                var trafficModel = this.config.trafficModel;

                var wrapper = document.createElement("div");

                var script = document.createElement("script");
                script.type = "text/javascript";
                script.src = "https://maps.googleapis.com/maps/api/js?key=" + this.config.key;
                script.setAttribute("defer", "");
                script.setAttribute("async", "");
                document.body.appendChild(script);

                script.onload = function () {

                        var service = new google.maps.DistanceMatrixService();

                        service.getDistanceMatrix(
                                {
                                        origins: [origin],
                                        destinations: [location1, location2, location3],
                                        travelMode: travelMode,
                                        drivingOptions: {
                                                departureTime: new Date(Date.now()),
                                                trafficModel: trafficModel
                                        },
                                        unitSystem: google.maps.UnitSystem.METRIC,
                                        avoidHighways: AvoidHighways,
                                        avoidTolls: AvoidTolls
                                },
                                function (response, status) {
                                        if (status !== "OK") {
                                                Log.error(self.name + " error was: " + status);
                                        } else {
                                                
                                                for (var i = 0; i < response.originAddresses.length; i++) {
                                                        var results = response.rows[i].elements;
                                                        for (var j = 0; j < results.length; j++) {                                                               
                                                                self.getContent(wrapper, nameList[j], results[j].duration, results[j].duration_in_traffic, self.config);
                                                        }
                                                }
                                        }
                                }
                        );
                };
                return wrapper;
        },
});
