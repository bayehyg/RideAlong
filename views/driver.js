var markers = [];

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
    console.log("hi");
    autoStart.addListener('place_changed', () => {
      const place = autoStart.getPlace();
      console.log("why not");
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
      console.log(place.geometry.location);
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
    $('#searchBtn').on('click', function() {
        const directionsDisplay = new google.maps.DirectionsRenderer({
            map: map, 
            polylineOptions: {
              strokeColor: 'blue' 
            }
          });
        const r = {
            start:{
                    lat: autoStart.getPlace().geometry.location.lat(),
                    lng: autoStart.getPlace().geometry.location.lng()
            }, 
            end:{ 
                    lat: autoDestination.getPlace().geometry.location.lat(),
                    lng: autoDestination.getPlace().geometry.location.lng() 
                },
            mode: "DRIVING" 
        };
        
        var routes = new Routes(r);
        const postData = routes.drawRoute(directionsDisplay, r);
        console.log(postData);
        fetch('http://localhost:3000/postroute', {
          method: 'POST', 
          headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': 'true'
          },
          body: JSON.stringify(r),
          })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.json();
              })
          .then(data => {
              console.log('Route posted successfully:', data);
          })
          .catch(error => {
              // Handle errors here
              console.error('Error posting route:', error);
        });
      });
    // google.maps.event.addListener(marker, "click", function () {
    //   infowindow.open(map, marker);
    // });
  };
class Routes {
    constructor(route) {
        this.route = route;
        this.directionsService = new google.maps.DirectionsService();
    }
    drawRoute(directionsDisplay, route) {
        const start = new google.maps.LatLng(this.route.start.lat, this.route.start.lng);  
        const end = new google.maps.LatLng(this.route.end.lat, this.route.end.lng);
        console.log(start);
        const request = {
            origin: start,
            destination: end,
            travelMode: 'DRIVING'
        };
        this.directionsService.route(request, function(response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
            console.log(route);
            const data = {
              "start": [route.start.lng, route.start.lat],
              "end": [route.end.lng, route.end.lat]
            }
            return data;
        } else {
            window.alert('Directions request failed due to ' + status);
    }});
}

}