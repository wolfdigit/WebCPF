
var cpfcomponent = {};

cpfcomponent.parse = function(pinmode) {
	
	var key_flag = false; // temporary solution
	var data = JSON.parse(pinmode);
	document.getElementById("content").innerHTML = '';
	
	for(var key in data.request) {
		
		if(key != 0)	// key 0 is ["resetPin"]
		{
			var filename = getfilename(data.request[key]);
			
			cpfcomponent.getComponent(filename);
			
			var pinname = getpinname(data.request[key]);
			
			if(pinname) {
				
					var sensor = getSensor(data.request[key]);
					
					if(key_flag) { key = key-1 };
				
					cpfcomponent.setPinId(key-1, sensor, pinname, filename);
					
					key_flag = false;
				
			} else {
				if(filename == 'grove_rgblcd_begin') {
					key_flag = true;
				}
			} 
		}
	}
}

cpfcomponent.getComponent = function(file) {
	try 
	{
		var xhr;
		xhr = new XMLHttpRequest();
		xhr.open("GET", "./html/" + file + ".html", false);
		xhr.send();
		
		cpfcomponent.setComponent(xhr.responseText);
		
	}
	catch(err)
	{
		console.log('Cannot get html file: ' + err);
	}
	
}

cpfcomponent.setComponent = function(htmlcode) {
	document.getElementById("content").innerHTML += htmlcode;
	
}

cpfcomponent.setPinId = function(key, name, pin, filename) {
	
	// Insert images
	var sensorImg = document.querySelectorAll(".sensor_img");
	if(name == 'general') {
		sensorImg[key].src = './images/'+filename+'.png';
	} else {
		var img_name = getImgName(name.trim());
		sensorImg[key].src = '../../media/'+img_name+'.png';
	}
	
	// Insert Name
	var sensorName = document.querySelectorAll(".sensor_name");
	if(name == 'general') {
		sensorName[key].innerHTML = pin;
	} else {
		sensorName[key].innerHTML = name;
	}
	sensorName[key].id = "name_" + pin; 
	
	// Insert value ID
	var sensorValue = document.querySelectorAll(".sensor_value");
	sensorValue[key].id = pin;
	
	if(filename == 'digitalOUTPUT') {
		sensorValue[key].parentNode.lastChild.htmlFor = pin;
	}
	
}


function getfilename(data) {
	if(data[0] == 'grove_newChainableLED' || data[0] == 'grove_rgblcd_begin') {
    	return data[0];
    }
	return data[0] + data[2];
}

function getSensor(data) {
	
	return data[3];
	
}


function getpinname(data) {
	if(data[0] == 'analog') {
		return "A" + data[1];
	}else if(data[0] == 'digital' || data[0] =='servo_init'){
		return "D" + data[1];
	}else {
		return false;
	}
}

//Ajax get images name
function getImgName(name) {
	
	var imgname;
	
	var xhr = new XMLHttpRequest();
	xhr.open('GET', './js/sensor.json', false);
    xhr.send();  
	
	if(xhr.readyState == 4) {
		var data = JSON.parse(xhr.responseText);
		return data[name];
	}
	
}


