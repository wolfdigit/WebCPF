
var CloudProfessor = function() {
	
	var cmd_url = "http://"+localStorage.CPFIP+":15180//tmp/d2d/cpf/request/shell.cmd";
	var set_url = "http://"+localStorage.CPFIP+":15180//tmp/d2d/arduino/request/ttyACM0.json";
	var get_url = "http://"+localStorage.CPFIP+":15180//tmp/d2d/arduino/input/ttyACM0.json";
	
	// Constructor
	
	// Get Mac address
	ajaxCPF(cmd_url).then(ajaxCPFSuccess, ajaxCPFError);
	
	function ajaxCPFSuccess(res) {
		document.getElementById("cpf_check").src = './images/yes.png';
		localStorage.isMatch = 1;
		console.log(res);
	}
	function ajaxCPFError() {
		document.getElementById("cpf_check").src = './images/no.png';
		console.log('no cpf');
		setTimeout(function() {
			ajaxCPF(cmd_url).then(ajaxCPFSuccess, ajaxCPFError);
		}, 1000);
	}
	
	// Private methods and properties
	function cpf_set (data, callback)
	{
		var json = {"data": data, "set_url": set_url};
		
		worker_set.postMessage(json);
		
		worker_set.onmessage = function (e) {
			if(e.data == 'success') {
				if(callback) {
					callback('init');
				}
			}
		}
	}
	
	function cpf_get ()
	{
		return analog; // Global variable in cpf_get.js
	}
	
	function ajaxCPF(url) {
		
		var promiseObj = new Promise(function(resolve, reject) {
		
			var xhr;
			xhr = new XMLHttpRequest();
			xhr.open('PUT', url, true);
			xhr.send("hciconfig hci0 | grep 'BD Address' | awk '{print $3}' | awk -F'[:]' '{print $4$5$6}'"); // Mac address
			
			xhr.onreadystatechange = function() {
				if(this.readyState === 4) {
					if(this.status === 200) {
						resolve(this.responseText);
					} else {
						reject(this.responseText);
					}
				}
				
			}
		});
		
		return promiseObj;
	}
	
	// cpf public methods
	
	this.initArduino = function (init, status) 
	{
		if(status == 'close') {
			cpf_set(init);
			return;
		}
		
		cpf_set(init, function(e){
			console.log(e);
			setTimeout(function(){
				// Check if have "input" init
				var reg = new RegExp("INPUT");
				if(reg.test(init)) {
					clear_input = false;
				} else {
					clear_input = true;
				}
				cpf_input.loop();
			}, 1000);
			setTimeout(function(){
				cpf.run_js(localStorage.code);
			}, 2000);
		});
	}
	
	this.run_js = function (code) 
	{
		// Javascript function
		eval(code);
	}
	
	this.get = function (socket, arg1)
	{
		var pin = socket.toLowerCase();
		var data;
		
		if(arg1 == 'dht11temp') {
			pin = pin + '-dht11';
			arg1 = 't';
		} else if (arg1 == 'dht11humi') {
			pin = pin + '-dht11';
			arg1 = 'h';
		} else {
			arg1 = false;
		}
		
		switch(socket) {
			case 'light sensor':
				data = cpf_get();
				
				if(typeof(data) == "object") {
					return data.a0;
				}else {
					return "N/A";
				}
				break;
			case 'temperature sensor':
				data = cpf_get();
				
				if (typeof(data) == "object") {
					return data.a1;
				} else {
					return "N/A";
				}
				break;
			default :
				data = cpf_get();
				
				if(typeof(data) == "object") {
					if(arg1) {
						return data[pin][arg1];
					} else {
						return data[pin];
					}
				}else {
					return "N/A";
				}
				break;
		}
	};
	
	this.set = function (socket, arg1, arg2, arg3)
	{
		var pin = socket.slice(1);
		var data;
		
		switch (socket) 
		{
			case 'rgb led':
				data = rgb_led(arg1, arg2, arg3);
				if(data) {
					cpf_set(data);
				}
				break;
			case 'white led':
				data = white_led(arg1);
				if(data) {
					cpf_set(data);
				}
				break;
			case 'fan':
				data = get_fan(arg1);
				if(data) {
					cpf_set(data);
				}
				break;
			case 'Servo180':
				data = get_servo(arg1.slice(1), arg2, arg3);
				if(data) {
					cpf_set(data);
				}
				break;
			case (socket.match(/grove_rgblcd/) || {}).input:
				data = rgb_lcd(socket, arg1, arg2, arg3);
				if(data) {
					cpf_set(data);
				}
				break;
			case 'D'+pin:
				if(arg1 == 'dig') {
					data = digital_write(pin, arg2);
				} else if (arg1 == 'pwm') {
					data = analog_write(pin, arg2);
				} else if (typeof(arg1) == 'number' && typeof(arg2) == 'number') {
					data = get_buzzer(pin, arg1, arg2);
				} else {
					data = digital_write(pin, arg1);
				}
				if(data) {
					cpf_set(data);
				}
				break;
		}
	};
	
	this.repeat = function ()
	{
		repeatCode = localStorage.code.replace("cpf.repeat();", '');
		cpf.run_js(repeatCode);
		cpf_repeat = setInterval(function(){ cpf.run_js(repeatCode); }, timer);
	}
	
	this.sleep = function (ms)
	{
		console.log('sleep: '+ms);
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
}; 

var UI = function() {
	
	this.get = function (socket, arg1)
	{
		var pin = socket.slice(1);
		
		switch (socket)
		{
			case 'rgb led':
				return document.getElementById(arg1+'led').value;
				break;
				
			case 'white led':
				if(document.getElementById('D2').checked) {
					return 1;
				}else {
					return 0;
				}
				break;
			case 'fan':
				return document.getElementById("D3").value;
				break;
			case 'D'+pin:
			
				var parent = document.getElementById(socket).parentNode;
				// PWM
				if (parent.id == 'pwm_block') 
				{
					return document.getElementById(socket).value;
				} 
				//digital output
				else if (parent.parentNode.id == 'digital_block') 
				{
					if(document.getElementById(socket).checked) {
						return 1;
					}else {
						return 0;
					}
				}
				//digital input
				else if (parent.id == 'digital_block') 
				{	
					if(document.getElementById(socket).innerHTML == 'N/A') {
						return 0;
					}
					return Number(document.getElementById(socket).innerHTML);
				}
				break;
		}
		
	};
	
	this.set = function (socket, arg1, arg2)
	{
		
		var pin = socket.slice(1);
		
		switch (socket)
		{
			case 'title':
				document.getElementById("header_title").innerHTML = arg1;
				break;
			case 'light sensor':
				document.getElementById("A0").innerHTML = arg1;
				break;
			case 'temperature sensor':
				document.getElementById("A1").innerHTML = arg1;
				break;
			case 'white led':
				document.getElementById("D2").checked = arg1;
				buttoncolor("D2");
				break;
			case 'rgb led':
				document.getElementById(arg1+'led').value = arg2;
				document.getElementById(arg1+'value').innerHTML = arg2;
				changeRGB(arg1);
				break;
			case 'fan':
				document.getElementById("D3").value = arg1;
				document.getElementById("D3").parentNode.lastChild.innerHTML = arg1;
				changePWM(document.getElementById("D3"), 'pwm');
				break;
			case 'Servo180':
				document.getElementById(arg1).value = arg2;
				document.getElementById(arg1).parentNode.lastChild.innerHTML = arg2;
				changePWM(document.getElementById(arg1), 'servo');
				break;
			case 'D'+pin:
				var parent = document.getElementById(socket).parentNode;
				// PWM
				if (parent.id == 'pwm_block') {
					document.getElementById(socket).value = arg1;
					document.getElementById(socket).parentNode.lastChild.innerHTML = arg1;
					changePWM(document.getElementById(socket), 'pwm');
				}
				// Digital read
				if (parent.id == 'digital_block') {
					document.getElementById(socket).innerHTML = arg1;
				}
				// Digital write
				if (parent.parentNode.id == 'digital_block') {
					document.getElementById(socket).checked = arg1;
					buttoncolor(socket);
				}
				break;
			case 'A'+pin:
				document.getElementById(socket).innerHTML = arg1;
				break;
		}
		
	};
	
};


/*
Get Sensors request data with json format:
 */

function digital_write(pin, value) {
	var time = new Date().getTime();
	return '{"request":"'+time+'","request":[["digitalWrite", '+pin+', '+value+']]}';
}

function analog_write(pin, value) {
	var time = new Date().getTime();
	return '{"request":"'+time+'","request":[["analogWrite", '+pin+', '+value+']]}';
}
 
function rgb_led (r, g, b)
{
	if(temp.D7.r == r && temp.D7.g == g && temp.D7.b == b) {
		return false;
	}
	
	temp.D7.r = r;
	temp.D7.g = g;
	temp.D7.b = b;
	
	var time = new Date().getTime();
	return '{"request":"'+time+'","request":[["grove_setColorRGB", 0, '+r+', '+g+', '+b+']]}';
}

function white_led (on_off)
{
	if(temp.D2 == on_off) {
		return false;
	}
	temp.D2 = on_off;
	var time = new Date().getTime();
	return '{"request":"'+time+'","request":[["digitalWrite", 2, '+on_off+']]}';
}

function get_fan(speed) {
	
	if(temp.D3 == speed) {
		return false;
	}
	temp.D3 = speed;
	var time = new Date().getTime();
	return '{"request":"'+time+'","request":[["analogWrite", 3, '+speed+']]}';
}

function get_servo(pin, speed, delay) {
	var time = new Date().getTime();
	return '{"request":"'+time+'","request":[["servo_pos_speed", '+pin+', '+speed+', '+delay+']]}';
}

function get_buzzer(pin, frequency, delay) {
	var time = new Date().getTime();
	return '{"request":"'+time+'","request":[["tone_play", '+pin+', '+frequency+', '+delay+']]}';
}

function rgb_lcd(name, arg1, arg2, arg3) {
	var time = new Date().getTime();
	if(name == 'grove_rgblcd_set_rgb') {
		return '{"request":"'+time+'","request":[["'+name+'", '+arg1+', '+arg2+', '+arg3+']]}';
	} else if (name == 'grove_rgblcd_print') {
		return '{"request":"'+time+'","request":[["'+name+'", '+arg1+', '+arg2+', "'+arg3+'"]]}';
	} else if (name == 'grove_rgblcd_clear') {
		return '{"request":"'+time+'","request":[["'+name+'"]]}';
	} else if (name == 'grove_rgblcd_display') {
		return '{"request":"'+time+'","request":[["'+name+'", '+arg1+']]}';
	}
}

var User = function () {
	
	this.login = function (loginform) 
	{
		// Get login info
		var loginInput = loginform.getElementsByTagName('INPUT');
		if(loginInput[0].checked) {
			var username = 'FB:' + loginInput[2].value;
		} else if(loginInput[1].checked) {
			var username = 'GP:' + loginInput[2].value;
		}
		var password = hex_md5(username); // **acer Aop Password = MD5(User Account)**
		
		// Setting url & header & Post data
		var url = "https://api.cloud.acer.com/cloud/v2/aopSessions";
		var header = {
			"X-aop-username": username,
			"X-aop-partnerId": "cpf",
			"X-aop-password": password,
			"Content-Type": "text/plain;charset=UTF-8"
		};
		var data = {
			"deviceHardwareInfo": "AA:BB:CC:DD:EE:FF",
			"deviceName": "Browser-WebCPF",
			"deviceClass": "PC",
			"appId": "1688879925038593"
		};
		
		// Post Start
		ajaxUser("POST", url, header, JSON.stringify(data)).then(
		// Login success
		function loginSuccess(res) {
			document.getElementById("loginShow").innerHTML = '';
			localStorage.userData = res;
			localStorage.username = username;
			alert(MSG['LoginSuccess']);
			history.go(0);
		// Login failed
		}, function loginFailed(res) {
			var err = JSON.parse(res);
			if(err.errCode == 6229) {
				document.getElementById("loginShow").innerHTML = MSG['LoginFailed'];
			}
		});
	}
	
	this.loadAopList = function ()
	{
		if(localStorage.username !== undefined && localStorage.userData !== undefined) {
			
			var cloudPanel = document.getElementById("cloud_panel");
			var userdata = JSON.parse(localStorage.userData);
			
			var url = "https://api-c1910.cloud.acer.com/cloud/v1/files/"+userdata.datasetId+"/arduinoblockly/my-idea/titlename4.json";
			var header = {"X-aop-credential": userdata.aopCredentialHeader};
			
			ajaxUser("GET", url, header).then(function success(res) {
				var aoptitle = res.split('\n');
				var list = cloudPanel.getElementsByTagName("table")[0];
				list.innerHTML = '';
				for(var i = 0; i < aoptitle.length; i++) {
					if(aoptitle[i] == 'Click here to save the program to cloud') {
						list.innerHTML += '<tr>'
										+ '<td><img src="./images/ic_save'+(i+1)+'_on.png">'+MSG['None']+'</td>'
										+ '<td><span onclick="Code.xmlCloudStore('+i+')" style="cursor:pointer;"><i class="fa fa-cloud-upload" aria-hidden="true"></i>'+MSG['SaveCode']+'</span></td>'
										+ '</tr>';
					} else {
						list.innerHTML += '<tr>'
										+ '<td><img src="./images/ic_save'+(i+1)+'_on.png"><span onclick="user.aopDownload('+i+')" style="cursor:pointer;">' + aoptitle[i] + '&nbsp<i class="fa fa-download" aria-hidden="true"></i></span></td>'
										+ '<td><span onclick="Code.xmlCloudStore('+i+')" style="cursor:pointer;"><i class="fa fa-cloud-upload" aria-hidden="true"></i>'+MSG['SaveCode']+'</span></td>'
										+ '</tr>';
					}
				}
				showList();
			}, function error(res) {
				console.log('Get Aop List Error: ' + res);
			});
	
			function showList() {
				document.getElementById("bg_dark").style.display = 'inline';
				cloudPanel.style.display = 'inline';
			}
			
		} else {
			alert(MSG['PleaseLogin']);
		}
	}
	
	this.aopUpload = function(data, id) 
	{
		var userdata = JSON.parse(localStorage.userData);
		var url = "https://api-c1910.cloud.acer.com/cloud/v1/files/"+userdata.datasetId+"/arduinoblockly/my-idea/cloudfile"+id+".html";
		var header = {"X-aop-credential": userdata.aopCredentialHeader};
		
		if(confirm(MSG['SaveConfirm'])) {
			ajaxUser("PUT", url, header, data).then(function success(res) {
				alert(MSG['SaveSuccess']);
				document.getElementById("bg_dark").style.display = 'none';
				document.getElementById("cloud_panel").style.display = 'none';
			}, function error(res) {
				console.log('upload Error: '+res);
			});
		}
	}
	
	this.aopDownload = function(id) 
	{
		var userdata = JSON.parse(localStorage.userData);
		var url = "https://api-c1910.cloud.acer.com/cloud/v1/files/"+userdata.datasetId+"/arduinoblockly/my-idea/cloudfile"+id+".html";
		var header = {"X-aop-credential": userdata.aopCredentialHeader};
		
		ajaxUser("GET", url, header).then(function success(res) {
			if(confirm(MSG['DownloadConfirm'])) {
				// Calling code.js function
				replaceBlocksfromXml(res);
				document.getElementById("bg_dark").style.display = 'none';
				document.getElementById("cloud_panel").style.display = 'none';
			}
		}, function error(res) {
			
		});
		
	}
	
	function ajaxUser(method, url, header, data) 
	{
		var promiseObj = new Promise(function(resolve, reject) {
		
			var xhr;
			xhr = new XMLHttpRequest();
			xhr.open(method, url, true);
			for(var key in header) {
				xhr.setRequestHeader(key, header[key]);
			}
			xhr.send(data);
			
			xhr.onreadystatechange = function() {
				if(this.readyState === 4) {
					if(this.status === 200) {
						resolve(this.responseText);
					} else if(this.status === 201) { // login response status: 201
						resolve(this.responseText);
					} else {
						reject(this.responseText);
					}
				}
			}
		});
		return promiseObj;
	}
	
}

/*
Define
*/

var cpf = new CloudProfessor();
var ui = new UI();
var user = new User(); // Maybe use aop

var repeatCode;			
var cpf_repeat;			// Use for clearTimeout
var timer = 1000;

var temp = JSON.parse('{"D7":{"r":"0", "g":"0", "b":"0"}, "D2":"0", "D3":"0", "D4":"0", "D5":"0", "D6":"0"}');

// Declare a thread
if (window.Worker) {
	var worker_set = new Worker("./js/worker_set.js");
}


