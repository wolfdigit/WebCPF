onmessage = function (e) {
	
	try
	{
		var xhr;
		xhr = new XMLHttpRequest();
		xhr.open('GET', e.data, true);
		xhr.send();
		
		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var data = this.responseText;
				console.log(data);
				postMessage(data);
			} else if(this.status == 500) {
				if(this.responseText.substr(11,4) == '1105') {
					console.log('stoping input');
					postMessage('err');
				}
			};
		};
		
		/*if(xhr.status == 200) {
			var data = xhr.responseText;
				console.log(data);
				postMessage(data);
		}*/
		
	}
	catch (err)
	{
		console.log(err);
	}
	
}