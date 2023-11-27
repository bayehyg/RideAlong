const apiUrl = 'https://api.ipgeolocationapi.com/geolocate';

var markers = []; 

$('#closeBtn').on('click', function() {
  $('#popup-modal').css('display', 'none');
});
$('#xBtn').on('click', function() {
  $('#popup-modal').css('display', 'none');
});

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
        animation: google.maps.Animation.BOUNCE,
        title: "Starting Location",
      });
      map.setCenter(place.geometry.location);
      if(markers[0]){
        markers[0].setMap(null);
      }
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
        animation: google.maps.Animation.BOUNCE,
        icon: {
          url: './assests/map-icon.png', // Change the color here
          scaledSize: new google.maps.Size(40, 40) // Size of the icon
        },
        title: "destination",
      });
      map.setCenter(place.geometry.location);
      if(markers[1]){
        markers[1].setMap(null);
      }
      markers[1] = marker4;
    }
  }); 
  console.log("where");
   
  // google.maps.event.addListener(marker, "click", function () {
  //   infowindow.open(map, marker);
  // });
  $('#searchBtn').on('click', async function() {
    const sLng = autoStart.getPlace().geometry.location.lng();
    const sLat = autoStart.getPlace().geometry.location.lat();
    const eLng = autoDestination.getPlace().geometry.location.lng(); 
    const eLat = autoDestination.getPlace().geometry.location.lat();
    $('#lists').on('click', '#tick', async function() {
      const start = [$(this).closest('li').data('startlat'), $(this).closest('li').data('startlng')];
      const end = [$(this).closest('li').data('endlat'), $(this).closest('li').data('endlng')];
      const walkingLine = {
        strokeColor: "#5e9ce2", 
        strokeOpacity: 0.5,
        strokeWeight: 4,
        strokeDashArray: [10, 10] 
      };
      const drivingLine = {
        strokeColor: "#000000", 
        strokeWeight: 6
      };
      await drawRoute([sLat,sLng], start, map, "WALKING", true, walkingLine);
      await drawRoute(start, end, map, "DRIVING", false, drivingLine);
      await drawRoute(end, [eLat,eLng], map, "WALKING", true, walkingLine);
    });
    console.log("where");
    
    //url: `http://localhost:3000/requestride?slat=${sLat}&slng=${sLng}&elat=${eLat}&elng=${eLng}`,
    $.ajax({
      type: 'GET',
      CORS: true,
      secure: true,
      url: `https://rideealong.co/requestride?slat=${sLat}&slng=${sLng}&elat=${eLat}&elng=${eLng}`, 
      success: async function(res) {    
        
        //const goodRoutes = await findGoodRoutes(res, autoStart.getPlace().geometry.location, autoDestination.getPlace().geometry.location);  not working now will
        //console.log(goodRoutes);
        if(res.length > 0){
          var userCoordinates = null;
          const geocoder = new google.maps.Geocoder();
          const { DistanceMatrixService } = await google.maps.importLibrary("routes");
          const distanceMatrixService = new DistanceMatrixService();
          const input = $("#start-location").val();
          console.log(input);
          await geocoder.geocode({ address: input }, (results, status) => {
            console.log(status);              
            userCoordinates = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
            console.log(userCoordinates);
            res.forEach( route => {
              const routeOrigin = new google.maps.LatLng(route.start[1], route.start[0]);
              distanceMatrixService.getDistanceMatrix({
                origins: [userCoordinates],
                destinations: [routeOrigin],
                travelMode: google.maps.TravelMode.WALKING,
              }, (response, err) => {
                if (err === 'OK') {
                  const element = response.rows[0].elements[0];
                  if (element) {
                    console.log('Distance ok: ', element);
                    console.log(element);
                    const list = `<li class="pb-3 sm:pb-4"
                            data-startlng="${route.start[0]}"
                            data-startlat="${route.start[1]}"  
                            data-endlng="${route.end[0]}"
                            data-endlat="${route.end[1]}">
                        <div class="flex items-center space-x-4 rtl:space-x-reverse">
                          <div class="flex-shrink-0">
                              <img class="w-8 h-8 rounded-full" src="${route.driverPicture}" alt="Neil image">
                          </div>
                          
                          <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                                ${route.name}
                              </p>
                              <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                              ${element.duration.text} away  
                              </p>
                          </div>
                          <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                              <a  href="#"><img id="tick" width="28" height="28" src="./assests/check.png"></a>
                          </div>
                        </div>
                    </li>`
                    $("#lists").append(list);    
                    
                  } else {
                    console.log('Distance Matrix API error:', response.status);
                  }
                } else {
                  console.log('Distance Matrix API error:', err);
                }
              });
              $('#hiddenList').css('display', '');
            });
          });

          

          
        }else{
          $('#popup-modal').css('display', 'flex');
        }
        

      },
      error: function(error) {
        console.error(error);
      }
    });

    
  });
};



// add autocomplete for input fields


async function findGoodRoutes(routes, s, e) {
  const { DistanceMatrixService } = await google.maps.importLibrary("routes");
  const distanceMatrixService = new DistanceMatrixService();
  const goodRoutes = [];

  const start = new google.maps.LatLng(s[0], s[1]);
  const destination = new google.maps.LatLng(e[0], e[1]);

  for (let i = 0; i < routes.length; ++i) {
    const originR = new google.maps.LatLng(routes[i].start[1], routes[i].start[0]);
    const destinationR = new google.maps.LatLng(routes[i].end[1], routes[i].end[0]);

    const [responseR, responseS, responseE, responseW] = await Promise.all([
      getDistanceMatrix(distanceMatrixService, originR, destinationR, 'DRIVING'),
      getDistanceMatrix(distanceMatrixService, s, originR, 'WALKING'),
      getDistanceMatrix(distanceMatrixService, destinationR, e, 'WALKING'),
      getDistanceMatrix(distanceMatrixService, s, e, 'WALKING')
    ]);

    if(responseW.duration && responseR.duration && responseS.duration && responseE.duration){
      const durationW = responseW.duration.text; 
      const durationR = responseR.duration.text; 
      const durationS = responseS.duration.text;
      const durationE = responseE.duration.text;
    }else{
      continue;
    }

    const walkT = parseDurationString(durationW);
    const totalRA = parseDurationString(durationR) + parseDurationString(durationS) + parseDurationString(durationE);

    if (totalRA < walkT) {
      continue;
    }

    const details = {
      r: routes[i],
      awayINT: parseDurationString(durationS),
      awayT: durationS,
      awayD: distanceS
    };

    goodRoutes.push(details);
  }

  goodRoutes.sort((a, b) => a.awayINT - b.awayINT);
  return goodRoutes;
}




async function drawRoute(start, end, map, mode, markers, lineOptions) {
  const directionsService = await new google.maps.DirectionsService();
  const directionsDisplay = await new google.maps.DirectionsRenderer({
    polylineOptions: lineOptions,
    map: map, 
    suppressMarkers: markers
  });    
  const startg = new google.maps.LatLng(start[0], start[1]);
  const endg = new google.maps.LatLng(end[0], end[1]);
  console.log(start);
  const request = {
      origin: startg,
      destination: endg,
      travelMode: mode
  };
  directionsService.route(request, function(response, status) {
  if (status === 'OK') {
      directionsDisplay.setDirections(response);
  } else {
      window.alert('Directions request failed due to ' + status);
}});
}

function parseDurationString(durationString) {
    
  const arr = durationString.split(" ");
  let totalMinutes = 0;

  if (arr.length >= 3) {
    totalMinutes += (parseInt(arr[0]) * 60) + parseInt(arr[2]);
    return totalMinutes;
  }

  if (arr[1] == 'hours' || arr[1] === 'hour') {
    totalMinutes += parseInt(arr[0]) * 60;
    return totalMinutes;
  }
  return parseInt(arr[0]);

  
}

