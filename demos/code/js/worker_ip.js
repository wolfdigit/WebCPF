onmessage = function (e) {	
	
	var json = {"count": 1};
	
	try
	{
		var xhr;
		xhr = new XMLHttpRequest();
		xhr.open("GET", e.data.url, true);
		xhr.timeout = 10000;
		xhr.send();
		
		xhr.onreadystatechange = function() {
			var json = {"ip":e.data.ip};
			if (this.readyState == 4 && this.status == 200) {
				if(this.responseText != undefined) {
					console.log(this.responseText);
					getMac(e.data.ip, this.responseText);
				}
			}
		};
		
		xhr.onerror = function() {
			postMessage(json);
		};
		
		xhr.ontimeout = function() {
			postMessage(json);
		};
		
	}
	catch (err)
	{
		console.log(err);
	}
}

function getMac(ip, version) {
	
	var url = "http://"+ip+":15180//tmp/d2d/cpf/request/shell.cmd";
	//var data = "sudo iw dev wlan0 info | grep ssid | awk '{ print $2 }' | sed -e 's/\\n//g' && hciconfig hci0 | grep 'BD Address' | awk '{print $3}' | awk -F'[:]' '{print $4$5$6}'";
	//var data = "sudo iw dev wlan0 info | grep ssid | awk '{ print $2 }' | sed -e 's/\\n//g'";
	var data = "hciconfig hci0 | grep 'BD Address' | awk '{print $3}' | awk -F'[:]' '{print $4$5$6}'"; 
	
	try
	{
		var xhr;
		xhr = new XMLHttpRequest();
		xhr.open("PUT", url, true);
		xhr.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
		xhr.send(data);
		
		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				if(this.responseText != undefined && this.responseText.length >= 6) {
					var json = {"mac": this.response, "ip": ip, "ver": version, "count": 1};
					console.log(json);
					postMessage(json);
				} else {
					getMac(ip, version);
				}
			} /*else if (this.status == 0) {
				getMac(ip, version);
			}*/
		};
		xhr.onerror = function () {
			getMac(ip, version);
		}
	}
	catch (err)
	{
		console.log(err);
	}
	
}