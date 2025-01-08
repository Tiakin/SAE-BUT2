function generateCalendarData(currentDate) {
    // Empty existing data
    let calendarData = [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    let firstDayIndex = new Date(`${year}-${month}-01`).getDay();

    // Adjustment for French notation (Monday=1, Sunday=7)
    if (firstDayIndex === 0) {
        firstDayIndex = 7;
    }

    const daysInCurrentMonth = new Date(year, month, 0).getDate();
    const daysInPreviousMonth = new Date(year, month - 1, 0).getDate();

    // Generate calendar days
    for (let day = 1; day <= 35; day++) {
        let dayNumber, dayMonth, dayYear, selected = false;

        // Days of previous month
        if (day < firstDayIndex) {
            dayNumber = daysInPreviousMonth - firstDayIndex + 1 + day;
            dayMonth = month - 1;
            dayYear = year;

            if (dayMonth === 0) {
                dayMonth = 12;
                dayYear -= 1;
            }
            // Days of the following month
        } else if (day >= firstDayIndex + daysInCurrentMonth) {
            dayNumber = day - (firstDayIndex + daysInCurrentMonth) + 1;
            dayMonth = month + 1;
            dayYear = year;

            if (dayMonth === 13) {
                dayMonth = 1;
                dayYear += 1;
            }

            // Days of the current month
        } else {
            dayNumber = day - firstDayIndex + 1;
            dayMonth = month;
            dayYear = year;
        }

        // Add the day's information to the calendar data
        calendarData.push({
            day: dayNumber,
            month: dayMonth,
            year: dayYear,
            selected: false,
        });
    }

    return calendarData;
}

async function recoverCalendarEvents(monthData) {
    const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(),
    });

    if (response.ok) {
        // Get data in json format
        const { eventsData } = await response.json();

        console.log(monthData)

        // Check if month day contain events
        for (let md = 0; md < 35; md++) {
            const monthDate =
                monthData[md].year + "-" +
                ("0" + monthData[md].month).slice(-2) + "-" +
                ("0" + monthData[md].day).slice(-2);

            for (let event in eventsData) {
                const eventDate = eventsData[event].date_debut.slice(0, 10);

                //console.log(eventDate);

                if (eventDate === monthDate) {
                    console.log("FOUND ! " + monthDate + " " + eventDate);

                    // monthDate[md].events.push({
                    //     title: eventDate[event].title
                    // })
                    //
                    // console.log(monthDate[md])
                }

            }
        }

    }
    else {
        throw Error("Failed to recover calendar events");
    }
}

export {generateCalendarData, recoverCalendarEvents};