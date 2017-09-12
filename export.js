function clickHandler() {
    var username = document.getElementById('export-username').value;
    if (!username || 0 === username.length) {
        showError("Nom d'utilisateur manquant");
        return;
    }
    fetchCalendar(username);
}

function buildCalendar(data) {
  var eventsCollection = [];
  for (var i = 0; i < data.length; i++) {
      var ev = buildEvent(data[i]);
      eventsCollection.push(ev);
  }

  var icsCalendar = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Our Company//NONSGML v1.0//EN\n" + eventsCollection.join('\n') + "\nEND:VCALENDAR";
  window.open( "data:text/calendar;charset=utf8," + encodeURI(icsCalendar));
}

Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}

Date.prototype.addMinutes= function(m){
    this.setMinutes(this.getMinutes()+m);
    return this;
}

String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find, 'g'), replace);
};

function pad(number) {
  var out = "";
  if (number < 10) out += "0";
  return out += number;
}

// date format ex: "20170911T123000";
Date.prototype.toICSDate = function() {
      return ""
        + this.getFullYear()
        + pad(this.getMonth() + 1)
        + pad(this.getDate())
        + "T"
        + pad(this.getHours())
        + pad(this.getMinutes())
        + pad(this.getSeconds())
    };

function buildEvent(data) {

    var startDate = new Date(data.date)
                        .addHours(data.startHour.substring(0, 2))
                        .addMinutes(data.startHour.substring(3, 5))
                        .toICSDate();

    var endDate = new Date(data.date)
                      .addHours(data.endHour.substring(0, 2))
                      .addMinutes(data.endHour.substring(3, 5))
                      .toICSDate();

    var summary = data.name;

    var location = '';
    if (data.classrooms != undefined && data.classrooms.length > 0) {
      location = data.classrooms.join(', ');
    }

    var desc = '';
    if (data.teachers != undefined && data.teachers.length > 0) {
      desc += 'Enseignant(s): ';
      desc += data.teachers.join(', ');
    }
    if (data.students != undefined && data.students.length > 0) {
      if (desc.length > 0) desc += '\n';
      desc += 'Etudiants(s): '
      desc += data.students.join(', ');
    }

    return "BEGIN:VEVENT\nDTSTART:" + startDate +"\nDTEND:" + endDate +"\nSUMMARY:" + summary +"\nLOCATION:" + location + "\nDESCRIPTION:" + desc + "\nEND:VEVENT";
}

function fetchCalendar(username) {
  var statement = {};
  statement["query"] = "mutation getPlanning($uid: String!) {\n  planning(uid: $uid) {\n  events {\n  name\n  startHour\n  endHour\n  rawDate\n  date\n  classrooms\n  teachers\n  students\n  __typename\n  }\n  groups\n  __typename\n  }\n  }\n ";
  statement["variables"] = { uid : username };
  statement["operationName"] = 'getPlanning';

  // Fetch the latest data.
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (request.readyState === XMLHttpRequest.DONE) {
      if (request.status !== 200) {
        showError("Récupération impossible");
        return;
      }

      var response = JSON.parse(request.response);
      if (!response || !response.data || !response.data.planning) {
          showError("Calendrier incorrect");
          return;
      }

      var events = response.data.planning.events;
      if (!events || 0 === events.length) {
          showError("Aucun évènement");
          return;
      }

      buildCalendar(events);
    }
  };
  request.open('POST', 'https://multi.univ-lorraine.fr/graphql');
  request.setRequestHeader('Content-type', 'application/json');
  request.send(JSON.stringify(statement));
};

function showError(err) {
  window.alert(err);
}

document.getElementById('export-btn').onclick = clickHandler;
