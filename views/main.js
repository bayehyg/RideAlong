const apiUrl = 'https://api.ipgeolocationapi.com/geolocate';

var markers = []; // array of start and destination markers, can not exceed two!

// create map
function createMap() {
  /* Map initialisation */
  let map = document.getElementById("map-canvas");
  let google = window.google;
  let lat = map.getAttribute("data-lat");
  let lng = map.getAttribute("data-lng");

  const myLatlng = new google.maps.LatLng(lat, lng);
  const mapOptions = {
    zoom: 12,
    scrollwheel: true,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    streetViewControl: false,
    styles: [
      {
        featureType: "administrative",
        elementType: "labels.text.fill",
        stylers: [{ color: "#444444" }],
      },
      {
        featureType: "landscape",
        elementType: "all",
        stylers: [{ color: "#f2f2f2" }],
      },
      {
        featureType: "poi",
        elementType: "all",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "road",
        elementType: "all",
        stylers: [{ saturation: -100 }, { lightness: 45 }],
      },
      {
        featureType: "road.highway",
        elementType: "all",
        stylers: [{ visibility: "simplified" }],
      },
      {
        featureType: "road.arterial",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "transit",
        elementType: "all",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "water",
        elementType: "all",
        stylers: [{ color: "#CBD5E1" }, { visibility: "on" }],
      },
    ],
  };

  map = new google.maps.Map(map, mapOptions);


  const contentString =
    '<div class="info-window-content"><h2>Notus JS</h2>' +
    "<p>A beautiful Dashboard for Bootstrap 4. It is Free and Open Source.</p></div>";

  const infowindow = new google.maps.InfoWindow({
    content: contentString,
  });

  
  function mark(coordinates){
    if(markers.length === 2){
      for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
      }
      markers = [];
      return;
    }
    if(markers.length > 0){
      const marker1 = new google.maps.Marker({
        position: coordinates,
        map: map,
        animation: google.maps.Animation.DROP,
        icon: {
          url: './assests/map-icon.png', // Change the color here
          scaledSize: new google.maps.Size(40, 40) // Size of the icon
        },
        title: "destination",
      });
      markers.push(marker1);
      return;
    }
    const marker2 = new google.maps.Marker({
      position: coordinates,
      map: map,
      animation: google.maps.Animation.DROP,
      title: "Starting Location",
    });
    markers.push(marker2);
  }
  
  google.maps.event.addListener(map, "click", function (event) {
    mark(event.latLng);
  });

  // add autocomplete for input fields
  const startLocation = document.getElementById('start-location');
  const destination = document.getElementById('destination');
  const autoStart = new google.maps.places.Autocomplete(startLocation);
  const autoDestination = new google.maps.places.Autocomplete(destination);
  autoStart.addListener('place_changed', () => {
    const place = autoStart.getPlace();
    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: " + place.name + "'");
      return;
    }else{
      const marker3 = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        animation: google.maps.Animation.DROP,
        title: "Starting Location",
      });
      map.setCenter(place.geometry.location);
      markers[0] = marker3;
    }
  });
  autoDestination.addListener('place_changed', () => {
    const place = autoDestination.getPlace();
    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }else{
      const marker4 = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        animation: google.maps.Animation.DROP,
        icon: {
          url: './assests/map-icon.png', // Change the color here
          scaledSize: new google.maps.Size(40, 40) // Size of the icon
        },
        title: "destination",
      });
      map.setCenter(place.geometry.location);
      markers[1] = marker4;
    }
  });  
  // google.maps.event.addListener(marker, "click", function () {
  //   infowindow.open(map, marker);
  // });
};


// add autocomplete for input fields


$('#searchBtn').on('click', function() {
  const destination = $('#destination').val();
  const timing = $('#timing').val();

  $.ajax({
    type: 'GET',
    url: 'http://localhost/search', 
    data: {startLocation, destination},
    success: function(response) {

      console.log(response);
    },
    error: function(error) {
      // Handle any errors
      console.error(error);
    }
  });
});



class Routes {
  constructor(route, map) {
    this.directionsService = new google.maps.DirectionsService();
    const directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(map);
  }
  drawRoute() {
    const start = new google.maps.LatLng(this.route.start); 
    const end = new google.maps.LatLng(this.route.end);
    const request = {
      origin: start,
      destination: end,
      travelMode: this.route.mode
    };
    directionsService.route(request, function(response, status) {
    if (status === 'OK') {
      directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status);
    }});
  }

}
