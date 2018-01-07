
var get_url = "http://"+localStorage.CPFIP+":15180//tmp/d2d/arduino/input/ttyACM0.json";

var analog;					// Global variable
var clear_input = false;	// Check if clear input loop or not
var cpf_input = {};

cpf_input.loop = function() {

	if(clear_input) return;	 // clear Timeout

	var xhr;
	xhr = new XMLHttpRequest();
	xhr.open('GET', get_url, true);
	xhr.timeout = 1000;
	xhr.send();
	
	xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			console.log(this.responseText);
			analog = JSON.parse(this.responseText);
			setTimeout(cpf_input.loop, 1000);
		} else if(this.status == 500) {
			console.log(this.responseText);
			if(this.responseText.substr(11,4) == '1105') {
				console.log('stoping input');
			}
		};
	};
	
	xhr.ontimeout = function(e) {
		console.log('timeout');
		cpf_input.loop();
	}
	
}
