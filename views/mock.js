function parseDurationString(durationString) {
    const hoursRegex = /(\d+)\s+hour/i;
    const hoursMatch = durationString.match(hoursRegex);
    const minutesRegex = /(\d+)\s+min/i;
    const minutesMatch = durationString.match(minutesRegex);

    let totalMinutes = 0;

    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1]) * 60;
    }

    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1]);
    }

    return totalMinutes;
  }

  console.log(parseDurationString("60 mins"));