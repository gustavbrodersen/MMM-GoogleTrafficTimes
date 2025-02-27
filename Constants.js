const TravelModes = {
	DRIVE: "drive",
	WALK: "walk",
	BICYCLE: "bicycle"
};

const TravelSymbols = {
	CAR: "car",
	BICYCLE: "bicycle",
	WALKING: "walking"
};

const OriginFormat = {
	ADDRESS: "address",
	COORDINATES: "coordinates",
};

if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        TravelModes,
        TravelSymbols,
        OriginFormat
    };
} else if (typeof window !== 'undefined') {
    // Browser environment
    window.TravelModes = TravelModes;
    window.TravelSymbols = TravelSymbols;
    window.OriginFormat = OriginFormat;
}