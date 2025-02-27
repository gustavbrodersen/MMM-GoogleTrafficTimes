class ScheduleHelper {
    static isScheduledNow(schedules) {
        if (!schedules || schedules.length === 0) return true;

        return schedules.some(schedule => {
            const now = new Date();
            const currentMinutes = this.toMinutes(now.getHours(), now.getMinutes());
      
            if (Array.isArray(schedule.days) && schedule.days.length > 0) {
              const currentDay = now.getDay();
              if (!schedule.days.includes(currentDay)) {
                return false;
              }
            }
      
            const startMinutes = this.toMinutes(schedule.startHH, schedule.startMM);
            const endMinutes = this.toMinutes(schedule.endHH, schedule.endMM);
      
            if (startMinutes !== null && endMinutes !== null) {
              return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
            } else if (startMinutes !== null) {
              return currentMinutes >= startMinutes;
            } else if (endMinutes !== null) {
              return currentMinutes <= endMinutes;
            }
            return true;
          });
    }

    static toMinutes(hh, mm) {
		if (hh == null || hh === '' || mm == null || mm === '') {
			return null;
		}
		return parseInt(hh, 10) * 60 + parseInt(mm, 10);
	}

    static isDestinationToCalculate(debug, destination){
        if (!Array.isArray(destination.schedules) || destination.schedules.length === 0) {
            return true;
        }
        if (debug) console.log(`Module MMM-GoogleTrafficTimes: isDestinationToCalculate -> ${JSON.stringify(destination.name)} ${this.isScheduledNow(destination.schedules)}`);
        return this.isScheduledNow(destination.schedules) || !!destination.showDestinationOutsideScheduleWithoutTraffic;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = ScheduleHelper;
} else if (typeof window !== 'undefined') {
    // Browser environment
    window.ScheduleHelper = ScheduleHelper;
}