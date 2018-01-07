
var cpfconnect = {};
var worker_ip;
var count_ip = 0;
var paircontent = '';

cpfconnect.search = function(myip) 
{
	worker_ip = new Worker("./js/worker_ip.js");
	var current_ip = myip.split('.');
	
	for(var i = 1; i<=255; i++) {

		current_ip = increment_ip(current_ip, i);
		
		var json = {"ip": current_ip.join('.'), "url": "http://"+current_ip.join('.')+":15180//etc/linpus-subversion"};
		
		worker_ip.postMessage(json);

	}
	
	worker_ip.onmessage = function (e) 
	{
		if ( e.data.mac != undefined ) {
			// response ex: 'CPF01-5G↵4080CA↵↵'
			//var mac = get_mac_plus(e.data.response.substring(e.data.response.length - 8, e.data.response.length - 2));
			//var wifi = e.data.response.substring(0, e.data.response.length - 9);
			var mac = get_mac_plus(e.data.mac);
			var ip = e.data.ip;
			var ver = e.data.ver.substring(e.data.ver.length - 9, e.data.ver.length - 1);
			
			paircontent += '<div><h3 class="match_mac">'+mac+'</h3>'
							+ '<img class="match_img" src="./images/cpf.png" />'
							+ '<button class="match_btn" onclick=cpfconnect.pair("'+mac+'","'+ip+'","'+ver+'")>'+MSG['ChooseButton']+'</button>'
							+ '<hr></div>';
			
			document.getElementById("cpf_match").innerHTML = paircontent + '<div id="loader"></div>';
		}
		
		if(typeof(e.data.count) == "number") {
			count_ip += e.data.count;
			console.log(count_ip);
			if(count_ip == 255) {
				setTimeout(searchover, 100);
			}
		}
	
	}
	
}

function searchover() 
{
	
	worker_ip.terminate(); //stop worker thread
	
	document.getElementById("loader").style.display = 'none';
	document.getElementById("cpf_match").innerHTML += '<div class="searchover">'+MSG['SearchOver']+'</div>';
	document.getElementById("cpf_title").innerHTML = MSG['ChooseTitle'];
}

cpfconnect.pair = function(mac, ip, ver, wifi) 
{
	worker_ip.terminate();
	
	document.getElementById("cpf_match").innerHTML = '<div style="margin-top: 150px; height: 70px; width: 70px;" id="loader"></div>';
	document.getElementById("cpf_title").innerHTML = MSG['PairTitle'];
	
	localStorage.CPFIP = ip;
	localStorage.cpfmac = mac;
	localStorage.cpfver = ver;
	localStorage.cpfwifi = wifi;
	
	setTimeout(function() {
		document.getElementById("cpf_match").innerHTML = '<div class="searchover" style="margin-top: 150px; font-size: 24pt; text-align: center; color: #00BBFF; font-weight: bold;">'+MSG['PairSuccess']+'</div>'
														+ '<div id="reloadfortwosec" class="searchover" style="font-size: 14pt; text-align: center">2'+MSG['ReloadMsg']+'</div>';
		setTimeout(function() {
			document.getElementById("reloadfortwosec").innerHTML = '1' + MSG['ReloadMsg'];
		}, 1000)
		setTimeout(function() {
			location.reload();
		}, 2000);
	}, 800);
	
}

function increment_ip(inc_ip, key)
{
	inc_ip[3] = key;

	return inc_ip;
}

function get_mac_plus(mac) 
{
	
	var lastChar = mac.substring(5);
	
	mac = mac.substring(0, 5);
	
	if(lastChar == "F") {
	
		lastChar = "0";
		
	}else {
		var tempChar = parseInt(lastChar, 16) + 1;
		lastChar = tempChar.toString(16).toUpperCase();
	}
	
	return mac + lastChar;
}

document.getElementById("CPFsearch").addEventListener("click", function() {
	
	paircontent = '';
	count_ip = 0;
	document.getElementById("cpf_title").innerHTML = MSG['Searching'];
	document.getElementById("cpf_match").innerHTML = '<div id="loader"></div>';
	
	getUserIP(function(ip){
		cpfconnect.search(ip);
	});
});

document.getElementById("bg_dark").addEventListener("click", function() {
	if(worker_ip !== undefined) {
		worker_ip.terminate();
	}
});

/**
 * Get the user IP throught the webkitRTCPeerConnection
 * @param onNewIP {Function} listener function to expose the IP locally
 * @return undefined
 */
function getUserIP(onNewIP) { //  onNewIp - your listener function for new IPs
    //compatibility for firefox and chrome
    var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var pc = new myPeerConnection({
        iceServers: []
    }),
    noop = function() {},
    localIPs = {},
    ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
    key;

    function iterateIP(ip) {
        if (!localIPs[ip]) onNewIP(ip);
        localIPs[ip] = true;
    }

     //create a bogus data channel
    pc.createDataChannel("");

    // create offer and set local description
    pc.createOffer().then(function(sdp) {
        sdp.sdp.split('\n').forEach(function(line) {
            if (line.indexOf('candidate') < 0) return;
            line.match(ipRegex).forEach(iterateIP);
        });
        
        pc.setLocalDescription(sdp, noop, noop);
    }).catch(function(reason) {
        // An error occurred, so handle the failure to connect
    });

    //listen for candidate events
    pc.onicecandidate = function(ice) {
        if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
        ice.candidate.candidate.match(ipRegex).forEach(iterateIP);
    };
}



