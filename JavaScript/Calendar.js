let now, year, month, currentDay;
//var eventList = []; //Stores all events so that they can be plotted on Calendar
var eventList;

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/calendar';
let tokenClient;
let gapiInited = false;
let gisInited = false;

// Callback after api.js is loaded.
function gapiLoaded() {
	gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
	await gapi.client.init({
		apiKey: API_KEY,
		discoveryDocs: [DISCOVERY_DOC],
	});
	gapiInited = true;
	maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
	tokenClient = google.accounts.oauth2.initTokenClient({
	client_id: CLIENT_ID,
	scope: SCOPES,
	callback: '', // defined later
	});
	gisInited = true;
	maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
	if (gapiInited && gisInited) {
	document.getElementById('authorise_button').style.visibility = 'visible';
	}
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
	tokenClient.callback = async (resp) => {
	if (resp.error !== undefined) {
		throw (resp);
	}
	document.getElementById('signout_button').style.visibility = 'visible';
	document.getElementById('authorise_button').innerText = 'Refresh';
		var items = document.getElementsByClassName('event')
		for (var i=0; i < items.length; i++) {
			items[i].style.display = 'block';
		}
	await listUpcomingEvents();
	};

	if (gapi.client.getToken() === null) {
	// Prompt the user to select a Google Account and ask for consent to share their data
	// when establishing a new session.
	tokenClient.requestAccessToken({prompt: 'consent'});
	} else {
	// Skip display of account chooser and consent dialog for an existing session.
	tokenClient.requestAccessToken({prompt: ''});
	}
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
	const token = gapi.client.getToken();
	if (token !== null) {
	google.accounts.oauth2.revoke(token.access_token);
	gapi.client.setToken('');
	document.getElementById('content').innerText = '';
	document.getElementById('authorise_button').innerText = 'Authorise Login';
	document.getElementById('signout_button').style.visibility = 'hidden';
	}
}

function openEventMenu(event, e) {
	//Formatting text
	title = "Event Title: " + event.name;
	duration = "Event Duration: " + event.duration + " Hours";
	startDate = "Event Start Date: " + event.startDate;
	endDate = "Event End Date: " + event.endDate;


	const menu = document.getElementById('eventMenu');
	document.getElementById('popupTitle').innerText = title;
	document.getElementById('popupDuration').innerText = duration;
	document.getElementById('popupStart').innerText = startDate;
	document.getElementById('popupEnd').innerText = endDate;
	document.getElementById('popup').style.display = 'flex';
}

function hidePopup() {
    document.getElementById('popup').style.display = 'none';
}

// This function adds the events to the calendar
function updateCalEvents(year, month) {
	const data = JSON.parse(eventList);
	const events = data.filter(item => {
		const dateStr = item.startDate;
		const part = dateStr.split('-');
		const itemMonth = Number(part[1])
		const itemYear = Number(part[2].toString().trim())
		return itemMonth === month && itemYear === year;
	})

	for (let i = 0; i < events.length; i++) {
		let childElement = document.getElementById(events[i].startDate);
		if (childElement) { //Makes sure that if something goes wrong the calendar is still visable
			let parentDay = childElement.parentElement;
			parentDay.style.backgroundColor = "#4169E1";

			parentDay.style.cursor = "pointer";
			parentDay.onclick = function(e) {
            	openEventMenu(events[i], e);
			};
		}
		else {
			console.log(`Error: Could not find an element with ID "${events[i].startDate}"`);
    	}
	}
	
	
}


//Lists 100 Events or displays error message
async function listUpcomingEvents() {
	let response;
	try {
	const request = {
		'calendarId': 'primary',
		'timeMin': (new Date()).toISOString(),
		'showDeleted': false,
		'singleEvents': true,
		'maxResults': 100,
		'orderBy': 'startTime',
	};
	response = await gapi.client.calendar.events.list(request);
	} catch (err) {
	document.getElementById('content').innerText = err.message;
	return;
	}

	const events = response.result.items;
	if (!events || events.length == 0) {
	document.getElementById('content').innerText = 'No events found.';
	return;
	}
	
	// API loaded ---------------------------------------------------------------------------------------------------------------------------------------
	//
	//
	//
	//
	// START WORKING HERE -------------------------------------------------------------------------------------------------------------------------------

	//Dragging data out of google API
	const startTime = [];
	const endTime = [];
	const urgency = []; //Urgency states the colour of boxes

	//Finalised Variables to use in data
	const eventNames = [];
	const durations = [];
	const startDates = [];
	const endDates = [];

	//Initialising 
	let dateCalculation = 0;

	// Loop for each event
	events.forEach(event => {

		// Event name
		eventNames.push(event.summary || '');

		//Start Date
		const start = event.start.dateTime || event.start.date;
		startTime.push(start);
		const startDateObj = new Date(start);

		// Push start date in DD-MM-YYYY
		dateCalculation = startDateObj.toISOString().split('T')[0]
		dateCalculation = dateCalculation.split("-").reverse().join("-");
		startDates.push(dateCalculation);


		// End Date
		const end = event.end.dateTime || event.end.date;
		endTime.push(end);
		const endDateObj = new Date(end);

		// Push End date in DD-MM-YYYY
		dateCalculation = endDateObj.toISOString().split('T')[0]
		dateCalculation = dateCalculation.split("-").reverse().join("-");
		endDates.push(dateCalculation);


		//Duration
		const durationMs = endDateObj - startDateObj;
		const durationHours = durationMs / (1000 * 3600);
		durations.push(durationHours);


		//Urgency Calculation
		const now = new Date();
		const diff = startDateObj - now; //Time to next event
		const hoursleft = diff / (1000 * 3600);
		urgency.push(hoursleft)
	});

	// In this section use the variables : eventNames[a], durations[a], startDates[a], endDates[a]
	// Where a = index of event.


	// Loads the html elements for the 3 event boxes.
	for (let i = 0; i < 3; i++) {
		const title = "event" + i + "Title";
		const duration = "event" + i + "Duration";
		const startDate = "event" + i + "Start";
		const endDate = "event" + i + "End";

		document.getElementById(title).innerText = "Event : " + "---" //eventNames[i]; - Add back for demo
		document.getElementById(duration).innerText = "Duration : " + durations[i] + " Hours";
		document.getElementById(startDate).innerText = "Start Date : " +  startDates[i];
		document.getElementById(endDate).innerText = "Start Date : " +  endDates[i];
		
		const box = "box" + i
		if (urgency[i] < 24) {
			const div = document.getElementById(box);
			div.style.backgroundColor = 'red';
		}
		else {
			const div = document.getElementById(box);
			div.style.backgroundColor = 'green';
		}
	}

	//Loads all 100 elements into a Json List
	const eventJson = [];
	for (let i = 0; i < 100; i++) {
		eventJson.push({
			name: eventNames[i],
			duration: durations[i],
			startDate: startDates[i],
			endDate: endDates[i]
		})
		eventList = JSON.stringify(eventJson, null, 2);
	}
	year = now.getFullYear();
	month = now.getMonth() + 1; // 0-11
	updateCalEvents(year, month);
	//let eventJson = JSON.stringify({ name: eventNames[i], duration: durations[i], startDate: startDates[i], endDate: endDates[i]})
	//eventList.push(eventJson);
}

// Renders the calendar 
function calendar(year, month) {
	const calendarEl = document.getElementById('calendar');
	calendarEl.innerHTML = '';

	// Generate day headers
	const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	daysOfWeek.forEach(day => {
	const header = document.createElement('div');
	header.className = 'day-header';
	header.innerText = day;
	calendarEl.appendChild(header);
	});

	//Sets the text above calendar
	const sentence = months[month] + " " + year
	document.getElementById("date").innerHTML = sentence;

	//Works out the first day and how many days in a month
	const firstDay = new Date(year, month, 0);
	const startingDay = firstDay.getDay();
	const daysInMonth = new Date(yeair, month + 1, 0).getDate();


	for (let i = 0; i < startingDay; i++) {
	const emptyCell = document.createElement('div');
	emptyCell.className = 'day';
	calendarEl.appendChild(emptyCell);
	}

	for (let day = 1; day <= daysInMonth; day++) {
	const dayCell = document.createElement('div');
	dayCell.className = 'day';
	const dateDiv = document.createElement('div');
	dateDiv.className = 'date';
	let varName = day.toString().padStart(2, '0') + "-" + (month + 1).toString().padStart(2, '0') + "-" + year; //Adds 0 to the leading nr
	dateDiv.id = varName;
	dateDiv.innerText = day;

	dayCell.appendChild(dateDiv);
	calendarEl.appendChild(dayCell);
	}
	
}

//Moves the calendar
function buttonDate(direction) {
	if (direction == 1){
		month++;
		if (month > 11) {
			month = 0;
			year ++;
		}
		currentDay = 0;
	}

	else {
		month--;
		if (month < 0) {
			month = 11;
			year --;
		}
		currentDay = 0;
	}
	calendar(year, month, currentDay)
	setTimeout(() => {
    	updateCalEvents(year, (month+1));
	}, 0);
	
}

function currentDate() {
	now = new Date();
	year = now.getFullYear();
	month = now.getMonth(); // 0-11
	currentDay = now.getDay();
	calendar(year, month, currentDay)
	}


	function toggleDarkMode() {
	const elements = ["darkModeButton", "content"]
	const classElements = ["calendar", "day-header", "day", "event"]
	var element = document.body;
	element.classList.toggle("dark-mode");

	for (var i = 0; i < elements.length; i++) {
		var element = document.getElementById(elements[i]);
		element.classList.toggle("dark-mode");
	}
	for (var i = 0; i < classElements.length; i++) {
		var element = document.getElementsByClassName(classElements[i]);
		for (var j = 0; j < element.length; j++) {
			element[j].classList.toggle("dark-mode");
		}
	}
}



function exportEvent(number){
	var numberlog = "Exporting box " + number
	console.log(numberlog)
	//const blob = new Blob([eventList], { type: 'application/json' });  //Use this to check the full json file
	const parsed = JSON.parse(eventList);
	const jsonString = JSON.stringify(parsed[number]);
	const blob = new Blob([jsonString], { type: 'application/json' });
	//const blob = new Blob([JSON.stringify([eventList[0]])], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	var fileName = "Event " + (number + 1) + " Export" + ".json";
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

window.onload = () => {
	currentDate();
};