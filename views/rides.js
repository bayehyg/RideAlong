$(document).ready(function () {
    fetchPostedRides();    
    fetchReservedRides();

    let selectedRouteId = null;
    let selectedRideType = null;

    $('#postedRidesContainer').on('click', '.btn-danger', function () {
        selectedRouteId = $(this).data('route-id'); // Assuming you add data-id attribute to buttons
        selectedRideType = 'posted';
        $('#deleteConfirmationModal').modal('show');
        $('#confirmDeleteBtn').click(function () {
            if (selectedRideType === 'posted') {
              deleteRide(selectedRouteId);
            }
            $('#deleteConfirmationModal').modal('hide');
        });
    });
    $('#reservedRidesContainer').on('click', '.btn-warning', function () {
        selectedRouteId = $(this).data('route-id'); // Assuming you add data-id attribute to buttons
        selectedRideType = 'reserved';
        $('#cancelConfirmationModal').modal('show');
        $('#confirmCancelBtn').click(function () {
            if (selectedRideType === 'reserved') {
              cancelRide(selectedRouteId);
            }
            $('#cancelConfirmationModal').modal('hide');
        });
    });

    

    
  });


function deleteRide(rideId) {
    $.ajax({
      url: `/orders/deleteRide/${rideId}`,
      method: 'DELETE',
      success: function (response) {
        fetchPostedRides(); // Refresh posted rides
      },
      error: function (err) {
        console.error('Error deleting ride:', err);
      }
    });
  }

  function cancelRide(rideId) {
    $.ajax({
      url: `/orders/cancelReservation/${rideId}`,
      method: 'POST',
      success: function (response) {
        fetchReservedRides(); // Refresh reserved rides
      },
      error: function (err) {
        console.error('Error canceling ride:', err);
      }
    });
  }

  
  function fetchPostedRides() {
    
    $.ajax({
      url: '/orders/postedRides',
      method: 'GET',
      success: function (data) {
        if (data.length === 0) {
          $('#postedRidesContainer').html('<p>No posted rides available.</p>');
        } else {
          data.forEach(async route => {
            $('#postedRidesContainer').append(await renderPostedRideCard(route));
          });
        }
      },
      error: function (err) {
        console.error('Error fetching posted rides:', err);
      }
    });
  }
  
 function fetchReservedRides() {
    $.ajax({
      url: '/orders/reservedRides',
      method: 'GET',
      success: function (data) {
        if (data.length === 0) {
          $('#reservedRidesContainer').html('<p>No reserved rides available.</p>');
        } else {
          data.forEach(route => {
            $('#reservedRidesContainer').append(renderReservedRideCard(route));
          });
        }
      },
      error: function (err) {
        console.error('Error fetching reserved rides:', err);
      }
    });
  }
  
   async function renderPostedRideCard(route) {
    const geocoder = new google.maps.Geocoder();
    var toLocation = await reverseGeocodeCoordinates(geocoder, { lat: route.end[0], lng: route.end[1] });
    return `
      <div id="card-posted" class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Ride to ${toLocation}</h5>
          <h6 class="card-subtitle mb-2 text-muted">Date: ${new Date(route.time).toLocaleDateString()}</h6>
          <p class="card-text"><i class="material-icons">schedule</i>Time: ${new Date(route.time).toLocaleTimeString()}</p>
          <p class="card-text"><i class="material-icons">people</i>Participants: ${route.passengers.length}</p>
          <button class="btn btn-danger btn-sm" data-route-id="${route._id}"><i class="material-icons">delete</i>Delete</button>
        </div>
      </div>
    `;
  }
  
  function renderReservedRideCard(route) {
    const geocoder = new google.maps.Geocoder();
    
    return `
      <div id="card-ordered" class="card mb-4">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <img src="${route.driverPicture}" alt="Driver Profile" class="rounded-circle me-3" width="40" height="40">
            <div>
              <h5 class="card-title mb-0">${route.name}</h5>
              <small class="text-muted">Driver</small>
            </div>
          </div>
          <h6 class="card-subtitle mb-2 text-muted">Date: ${new Date(route.time).toLocaleDateString()}</h6>
          <p class="card-text"><i class="material-icons">schedule</i>Time: ${new Date(route.time).toLocaleTimeString()}</p>
          <p class="card-text"><i class="material-icons">people</i>Participants: ${route.passengers.length}</p>
          <button class="btn btn-warning btn-sm" data-route-id="${route._id}"><i class="material-icons">close</i>Cancel</button>
        </div>
      </div>
    `;
  }

async function reverseGeocodeCoordinates(geocoder, coordinates) {
    var location;
    await geocoder.geocode({ location: coordinates }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[0]) {
            console.log(results[0].formatted_address);
          location = results[0].formatted_address;
        }
      }
    });
    return location
}
  
  