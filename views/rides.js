$(document).ready(function () {
    // Fetch and render posted rides
    fetchPostedRides();
  
    // Fetch and render reserved rides
    fetchReservedRides();
  });
  
  function fetchPostedRides() {
    $.ajax({
      url: '/orders/postedRides',
      method: 'GET',
      success: function (data) {
        if (data.length === 0) {
          $('#postedRidesContainer').html('<p>No posted rides available.</p>');
        } else {
          data.forEach(route => {
            $('#postedRidesContainer').append(renderPostedRideCard(route));
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
  
  function renderPostedRideCard(route) {
    return `
      <div id="card-posted" class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Ride to ${route.endLocation}</h5>
          <h6 class="card-subtitle mb-2 text-muted">Date: ${new Date(route.time).toLocaleDateString()}</h6>
          <p class="card-text"><i class="material-icons">schedule</i>Time: ${new Date(route.time).toLocaleTimeString()}</p>
          <p class="card-text"><i class="material-icons">people</i>Participants: ${route.passengers.length}</p>
          <button class="btn btn-danger btn-sm"><i class="material-icons">delete</i>Delete</button>
        </div>
      </div>
    `;
  }
  
  function renderReservedRideCard(route) {
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
          <button class="btn btn-danger btn-sm"><i class="material-icons">delete</i>Delete</button>
        </div>
      </div>
    `;
  }
  