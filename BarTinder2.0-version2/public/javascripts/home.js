var state = { 'page_id': 2};
var title = 'BarTinder';
var url = '/home';
history.pushState(state, title, url);
console.log(state+title+url);
var disco;

ajax_page_load();

$('#forward_button').on('click', function(){
	advance();
});

$('#backward_button').on('click', function(){
	backward();
});

function ajax_page_load() {	
	console.log(localStorage.getItem("current_venue"));
	if (localStorage.getItem("current_venue")) {
		current_venue = localStorage.getItem("current_venue");
		home_render(current_venue);
	} else {
		var position = 0;
		var rand_array = [0];
		var rand_num = 0;
		var count = 0;
		var current_venue_array = [0];
		var current_venue = 0;
		var venues_length = 23;
		localStorage.setItem("current_venue", current_venue);
		localStorage.setItem("position", position);
		localStorage.setItem("rand_num", rand_num);
		localStorage.setItem("rand_array", JSON.stringify(rand_array));
		localStorage.setItem("count", count);
		localStorage.setItem("current_venue_array", JSON.stringify(current_venue_array));
		localStorage.setItem("venues_length", venues_length);
		home_render(current_venue);
	}
};

var ven_up
function home_render(current_venue){
	clearInterval(ven_up);
	var clicks = 0;
	$.ajax({
		url: '/home_render',
    dataType: "json",
    method: "POST",
    data: {
      current_venue: current_venue
      },
    success: function(data, textStatus, jqXHR){
    	console.log(data);
      current_venue=data['current_venue'];
      venue=data['venue'];
      venues_length=data['venues_length'];
      venue_name = venue['name'];
      venue_logo = venue.logo_url;
      venue_id = venue['_id'];
      ven_up = setInterval('venueUpdate(venue_id)', 2000);
      venue_comment = venue.comment;
      patron_number = venue.patron_number;
      capacity = venue.capacity;
      comment_html = "<p>"+venue_comment+"</p>";
      url_css = "url("+venue_logo+")";
      number_html = patron_number+"<span style=''> / </span>"+capacity
      $('#venue_info').html(venue_name);
      bar_info(venue, clicks);
      $('.fill').css({
									'overflow': 'hidden',
									'background-size': '100%',
									'background-position': 'center',
									'background-image': url_css,
									'opacity': '0.7'
      					});
      $('.comment_box').html(comment_html);
      $('#pat_num').html(number_html);
      clearInterval(disco);
			var count_fraction = parseFloat(patron_number)/capacity;
			if (count_fraction <= 0.30){
				$('#pat_num').css('color', '#00FFFF');
				$('.patron_number').html("");
			} 
			else if (count_fraction <= 0.60){
				$('#pat_num').css('color', '#FFFF00');
				$('.patron_number').html("");
			}
			else if (count_fraction <= 0.90){
				$('#pat_num').css('color', '#FF0040');
				$('.patron_number').html("");
			}
			else {
				console.log(">90% disco");
				$('#pat_num').css('color', 'white');
				disco = setInterval('disco_ball_gif()', 3000 );
			}
		}
	});
};

function disco_ball_gif(){
	$('.patron_number').html('<iframe  class="animated bounceInLeft" id="disco" src="//giphy.com/embed/jRx59nrqDtXHy" leftframeBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="http://giphy.com/gifs/party-ball-lights-jRx59nrqDtXHy"></a></p>');
};

function bar_info(venue, clicks){
	$('#venue_info').on('click', function() {
		clicks++
		if (clicks % 2 == 1) {
			hours = venue['hours'];
			name = venue['name'];
			console.log('odd click');
			$('#venue_info').html(name + '</br><ul><li><span class="info">LOCATION:</span>'+ venue['location'] +'</li><li><span class="info">HOURS:</span>   <'+hours+'</li><li><a href="'+venue['website_url']+'" target="_blank">'+venue['website_url']+'</li></ul>');		
		} else {
			name = venue['name'];
			console.log('even click');
 			$('#venue_info').html(name);
		}
	});
};

var storage_object = {};
function advance() {
	storage_getter();
	position = storage_object['position'];
	rand_array = storage_object['rand_array'];
	rand_num = storage_object['rand_num'];
	count = storage_object['count'];
	current_venue_array = storage_object['current_venue_array'];
	current_venue = storage_object['current_venue'];
	venues_length = storage_object['venues_length'];
	position++
	console.log("position after increment "+position);
	console.log("venue array length after increment "+current_venue_array.length);
	console.log("Count after increment "+count);
  	if (position < current_venue_array.length) {
    	current_venue = current_venue_array[position];
    	console.log("current venue if pos < arraylength: "+current_venue);
			storage_setter(current_venue,position,rand_num,rand_array,count,current_venue_array, venues_length);
			clearInterval(ven_up);
			home_render(current_venue);
  	}
  	else {
    	var repeat= true;
    	while (repeat)
    	{
    	console.log("rand_num prior to randomizer (1st step of while): "+rand_num);
    	console.log("venues_length")
      rand_num = Math.floor(Math.random()*venues_length); 
      console.log("random number generated (1st step of while): "+rand_num);
      console.log("random array (1st step of while): "+rand_array);
      for(var i=0; i<=count; i++)
      {
        if (rand_array[i] == rand_num)
        {
          repeat=true;
          break;
        }
        else 
          repeat=false;
      }
      if(repeat)
        continue;
    	}
    	rand_array[count]=rand_num;
    	count++;
    	if (rand_array.length == venues_length){
    		console.log("rand array prior to getting zeroed out: "+rand_array);
      	rand_array = [];
      	count=0;
    	}
    	console.log("This is after check if iterated through entire database of venues");
    	current_venue = rand_num;
    	console.log("Current venue after randomizer: "+current_venue);
    	current_venue_array.push(current_venue);
    	console.log("Current venue array after pushing new venue: "+current_venue_array)
				if (position > 4) {
			  	position = 4;
			  	current_venue_array.shift();
			  	console.log("Current venue array after shift (going beyond 4 memory places): "+current_venue_array);
				}
			storage_setter(current_venue,position,rand_num,rand_array,count,current_venue_array,venues_length);
			clearInterval(ven_up);
			home_render(current_venue);
		}		
};

function backward() {
	current_venue = localStorage.getItem("current_venue");
	position = localStorage.getItem("position");
	current_venue_array = JSON.parse(localStorage["current_venue_array"]);
	position--
	console.log("Position after decrement: "+position);
	if (position < 0){
		position = 0;
		return;
	}
	current_venue = current_venue_array[position];
	console.log("After begining of array check: current venue - "+current_venue + " position - "+position+" current array - "+current_venue_array);
	localStorage.setItem("current_venue", current_venue);
	localStorage.setItem("position", position);
	localStorage.setItem("current_venue_array", JSON.stringify(current_venue_array));
	clearInterval(ven_up);
	home_render(current_venue);
};

function storage_setter(current_venue,position,rand_num,rand_array,count,current_venue_array,venues_length){
	console.log("setter function: rand_array- "+rand_array+" current_venue_array- "+current_venue_array);
	console.log("setter function: JSON.stringify(rand_array)- "+JSON.stringify(rand_array)+" JSON.stringify.current_venue_array- "+JSON.stringify(current_venue_array))
	localStorage.setItem("current_venue", current_venue);
	localStorage.setItem("position", position);
	localStorage.setItem("rand_num", rand_num);
	localStorage.setItem("rand_array", JSON.stringify(rand_array));
	localStorage.setItem("count", count);
	localStorage.setItem("current_venue_array", JSON.stringify(current_venue_array));
	localStorage.setItem("venues_length", venues_length);
};

function storage_getter(){
	current_venue = localStorage.getItem("current_venue");
	position = localStorage.getItem("position");
	rand_num = localStorage.getItem("rand_num");
	rand_array = JSON.parse(localStorage["rand_array"]);
	count = localStorage.getItem("count");
	current_venue_array = JSON.parse(localStorage["current_venue_array"]);
	venues_length = localStorage.getItem("venues_length");
	storage_object = {
		"current_venue": current_venue,
		"position": position,
		"rand_num": rand_num,
		"rand_array": rand_array,
		"count": count,
		"current_venue_array": current_venue_array,
		"venues_length": venues_length
	}
	return storage_object;
};
			
function venueUpdate(venue_id) {
	$.ajax({
    url: '/wasVenueUpdated',
    dataType: "json",
    method: "POST",
    data: {
      venue_id: venue_id,
      },
    success: function(data, textStatus, jqXHR){
      recent_modified = data['recent_modified'];
      if (recent_modified) {
      	console.log("you should only see this if recent modified is true: recent modified is "+recent_modified);
      	current_venue = localStorage.getItem("current_venue");
      	clearInterval(ven_up);
    		home_render(current_venue);
    	}
    },
    error: function(XMLHttpRequest, textStatus, errorThrown){
    }
 	});
};