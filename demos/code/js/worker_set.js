
onmessage = function (e) {
	
	ajaxPut(e).then(sendSuccess, sendError);
	
	function sendSuccess() {
		postMessage('success');	
	}
	
	function sendError(res) {
		console.log(res);
		var data = res.substr(11,4);
		
		if(data == '1106') {
			setTimeout(function(){
				ajaxPut(e).then(sendSuccess, sendError);
			}, 50);
		}
	}
	
}
function ajaxPut(e) {
	
	var promiseObj = new Promise(function(resolve, reject) {
		
		var xhr;
		xhr = new XMLHttpRequest();
		xhr.open('PUT', e.data.set_url, true);
		xhr.send(e.data.data);
		
		xhr.onreadystatechange = function() {
			if(this.readyState === 4) {
				if(this.status === 200) {
					console.log('send OK');
					resolve();
				} else {
					reject(this.responseText);
					console.log('send Failed');
				}
			}
		}
	});
	
	return promiseObj;
}