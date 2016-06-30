 	var new_value = 0;
 	var state = { 'page_id': 3};
  var title = 'BarTinder';
  var url = '/clicker';
  history.pushState(state, title, url);
  venue_id = document.getElementById("venue_id").value;
  console.log(venue_id);
  if (localStorage.getItem(venue_id)) {
    var total_entrants = localStorage.getItem(venue_id);
    console.log("local storage of venue id key: "+localStorage.getItem(venue_id));
    document.getElementById("total_entrants").value = total_entrants;
  } else {
    var total_entrants = 0;
    document.getElementById("total_entrants").value = total_entrants;
    localStorage.setItem(venue_id, total_entrants);
    console.log("local storage if nothing in that venue id key: "+localStorage.getItem(venue_id));
  }
 	function increase(){
    current_value = document.getElementById("counter1").value;
    new_value = parseInt(current_value) + 1;
    total_entrants = parseInt(total_entrants) + 1;
    document.getElementById("total_entrants").value = total_entrants;
    document.getElementById("counter1").value = new_value;
    venue_id = document.getElementById("venue_id").value;
    localStorage.setItem(venue_id, total_entrants);
    update_db(venue_id,new_value);
 	}
 	function reduce(){
    current_value = document.getElementById("counter1").value;
    new_value = parseInt(current_value) - 1;
    if (new_value < 0){
    	new_value = 0;
    }
		document.getElementById("counter1").value = new_value;
    venue_id = document.getElementById("venue_id").value;
    update_db(venue_id,new_value);
 	}

  function update_db(venue_id, new_value, comment) {
    $.ajax({
      url: '/clicker_update',
      dataType: "json",
      method: "POST",
      data: {
        venue_id: venue_id,
        patron_number: new_value,
        comment: comment
        },
      success: function(data, textStatus, jqXHR){
        console.log("Success");
      }
    });
  }

  $('.clicker').on('submit', function(){
    var comment = $('#comment').val();
    var venue_id = $('#venue_id').val();
    var new_value = document.getElementById("counter1").value;
    update_db(venue_id,new_value,comment);
    return false;
  });

  $('#reset_button').on('click', function(){
    total_entrants = 0;
    new_value = 0;
    var comment = "Come on in!";
    document.getElementById("comment").value = comment;
    document.getElementById("total_entrants").value = 0;
    document.getElementById("counter1").value = 0;
    venue_id = document.getElementById("venue_id").value;
    localStorage.setItem(venue_id, 0);
    update_db(venue_id,new_value,comment);
  });
