
// The Slider
function backToBlockly() {
	
	// Clear CPF action
	// ****
	if(cpf_repeat !== 'undefined') {
		clearInterval(cpf_repeat);
	}
	
	// Clear cpf.get
	clear_input = true;
	
	// Init
	cpf.initArduino(localStorage.init, 'close');
	
	// User Panel
	document.getElementById("user_panel").style.display = 'none';
	
	// Cloud Panel
	document.getElementById("cloud_panel").style.display = 'none';
	
	// Slide out Control panel
	document.getElementById("control_panel").className = "slideRight";
	setTimeout(hide, 700);
	$("#bg_dark").fadeOut(400);
	if(document.getElementById("cpf_panel").style.display == 'block'){
		$("#cpf_panel").hide();
		document.getElementById("cpf_panel_title").classList.remove('slideLeftFast');
	}
}

function hide() {
	document.getElementById("control_panel").style.display = 'none';
}

// RGB color Changes
function changeRGB(arg) {
	
	var value = document.getElementById(arg+"led").value;
	
	document.getElementById(arg+"value").innerHTML = value;
	
	var bgcolor;
	var n = value / 2.7;
	
	switch (arg) {
		case 'r':
			bgcolor = 'red';
			break;
		case 'g':
			bgcolor = 'green';
			break;
		case 'b':
			bgcolor = 'blue';
			break;
	}
	
	$('#'+arg+'led').css({
		'background-image':'-webkit-linear-gradient(left ,'+bgcolor+' 0%,'+bgcolor+' '+n+'%,#fff '+n+'%, #fff 100%)'
    });
	
}

// Change PWM Bar value & color
function changePWM(input, type) {
	
	input.parentNode.lastChild.innerHTML = input.value;
	
	var color1;
	
	if(type == 'pwm') {
		var n = input.value / 2.7;
		color1 = '#777';
	} else if(type == 'servo') {
		var n = input.value / 1.8;
		color1 = '#33FF33';
	}
	
	input.style.backgroundImage = '-webkit-linear-gradient(left ,'+color1+' 0%, '+color1+' '+n+'%,#fff '+n+'%, #fff 100%)';

}

// Change button background color
function buttoncolor(id) {
	var checked = document.getElementById(id).parentNode;
	
	if(document.getElementById(id).checked == true) {
		checked.style.backgroundColor = '#aaa';
	}else {
		checked.style.backgroundColor = '#ddd';
	}
}

// Select Lesson
function changeLesson(lesson) {
	location.href = './index.html?lesson=' + lesson;
}

// cpf panel
function cpfPanel() {
	$("#cpf_panel").show();
	$("#bg_dark").fadeIn(200);
}

// user panel
function userPanel() {
	$("#user_panel").show();
	$("#bg_dark").fadeIn(200);
}

$("#cpfbutton").hover(function() {
	if(localStorage.isMatch == 1) {
		document.getElementById("cpf_mac").innerHTML = localStorage.cpfmac;
		document.getElementById("cpf_ver").innerHTML = localStorage.cpfver;
		document.getElementById("cpf_wifi").innerHTML = MSG['None'];
		document.getElementById("cpf_ip").innerHTML = localStorage.CPFIP;
	} else {
		document.getElementById("cpf_mac").innerHTML = MSG['None'];
		document.getElementById("cpf_ver").innerHTML = MSG['None'];
		document.getElementById("cpf_ip").innerHTML = MSG['None'];
		document.getElementById("cpf_wifi").innerHTML = MSG['None'];
	}
    $("#cpf_info").show();
}, function() {
	$("#cpf_info").hide();
});
