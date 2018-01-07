/**
 * Blockly Demos: Code
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview JavaScript for Blockly's Code demo.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * Create a namespace for the application.
 */
var Code = {};

/**
 * Lookup for names of supported languages.  Keys should be in ISO 639 format.
 */
Code.LANGUAGE_NAME = {
  'en': 'English',
  'es': 'Spanish',
  'zh-hant': '繁體中文',
  'zh-hans': '簡體中文',
  'it': 'Italian',
  'fr': 'french',
  'nl': 'Dutch'
};

/**
 * List of RTL languages.
 */
Code.LANGUAGE_RTL = ['ar', 'fa', 'he', 'lki'];

/**
 * Blockly's main workspace.
 * @type {Blockly.WorkspaceSvg}
 */
Code.workspace = null;

var lesson = 'Arduino-1';
var lastClickTime = 0;
var clickTimeDelta = 400;
var click_startx = 0;
var lastclick_startx = 0;
var xmlCloudStore_clickTime = 3000;
var xmlCloudStore_lastClickTime = 0;


Code.WORKSPACE_START_SCALE = {
  'Arduino-1': '0.9',
  'Arduino-2': '0.9',
  'Arduino-3': '0.6',
  'Arduino-4': '0.9',
  'Arduino-5': '0.9',
  'Arduino-6': '0.7',
  'Arduino-7': '0.8',
  'Arduino-8': '0.8',
  'Arduino-9': '0.8'
};

/**
 * Extracts a parameter from the URL.
 * If the parameter is absent default_value is returned.
 * @param {string} name The name of the parameter.
 * @param {string} defaultValue Value to return if paramater not found.
 * @return {string} The parameter value or the default value if not found.
 */
Code.getStringParamFromUrl = function(name, defaultValue) {
  var val = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
  return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};

/**
 * Get the language of this user from the URL.
 * @return {string} User's language.
 */
Code.getLang = function() {
  var lang = Code.getStringParamFromUrl('lang', '');
  if (Code.LANGUAGE_NAME[lang] === undefined) {
    // Default to English.
    lang = 'zh-hant';
  }
  return lang;
};

/**
 * Get  workspace startScale depends on lessons.
 */ 
Code.getWorkspaceStartScale = function() {
  var lesson = Code.getStringParamFromUrl('lesson', '');
  var workspaceStartScale = Code.WORKSPACE_START_SCALE[lesson];
  if (workspaceStartScale === undefined) {
    // Default to Lesson1.
   workspaceStartScale = '1.0';
  }

  return workspaceStartScale;
};

//Code.StartScale = Code.getWorkspaceStartScale();

/**
 * Is the current language (Code.LANG) an RTL language?
 * @return {boolean} True if RTL, false if LTR.
 */
Code.isRtl = function() {
  return Code.LANGUAGE_RTL.indexOf(Code.LANG) != -1;
};

/**
 * Load blocks saved on App Engine Storage or in session/local storage.
 * @param {string} defaultXml Text representation of default blocks.
 */
Code.loadBlocks = function(defaultXml) {
  try {
    var loadOnce = window.sessionStorage.loadOnceBlocks;
  } catch(e) {
    // Firefox sometimes throws a SecurityError when accessing sessionStorage.
    // Restarting Firefox fixes this, so it looks like a bug.
    var loadOnce = null;
  }
  if ('BlocklyStorage' in window && window.location.hash.length > 1) {
    // An href with #key trigers an AJAX call to retrieve saved blocks.
    BlocklyStorage.retrieveXml(window.location.hash.substring(1));
  } else if (loadOnce) {
    // Language switching stores the blocks during the reload.
    delete window.sessionStorage.loadOnceBlocks;
    var xml = Blockly.Xml.textToDom(loadOnce);
    Blockly.Xml.domToWorkspace(xml, Code.workspace);
  } else if (defaultXml) {
    // Load the editor with default starting blocks.
    var xml = Blockly.Xml.textToDom(defaultXml);
    Blockly.Xml.domToWorkspace(xml, Code.workspace);
  } else if ('BlocklyStorage' in window) {
    // Restore saved blocks in a separate thread so that subsequent
    // initialization is not affected from a failed load.
    window.setTimeout(BlocklyStorage.restoreBlocks, 0);
  }
};

/**
 * Save the blocks and reload with a different language.
 */
Code.changeLanguage = function() {
  // Store the blocks for the duration of the reload.
  // This should be skipped for the index page, which has no blocks and does
  // not load Blockly.
  // MSIE 11 does not support sessionStorage on file:// URLs.
  if (typeof Blockly != 'undefined' && window.sessionStorage) {
    var xml = Blockly.Xml.workspaceToDom(Code.workspace);
    var text = Blockly.Xml.domToText(xml);
    window.sessionStorage.loadOnceBlocks = text;
  }

  var languageMenu = document.getElementById('languageMenu');
  var newLang = encodeURIComponent(
      languageMenu.options[languageMenu.selectedIndex].value);
  var search = window.location.search;
  if (search.length <= 1) {
    search = '?lang=' + newLang;
  } else if (search.match(/[?&]lang=[^&]*/)) {
    search = search.replace(/([?&]lang=)[^&]*/, '$1' + newLang);
  } else {
    search = search.replace(/\?/, '?lang=' + newLang + '&');
  }

  window.location = window.location.protocol + '//' +
      window.location.host + window.location.pathname + search;
};

/**
 * Bind a function to a button's click event.
 * On touch enabled browsers, ontouchend is treated as equivalent to onclick.
 * @param {!Element|string} el Button element or ID thereof.
 * @param {!Function} func Event handler to bind.
 */
Code.bindClick = function(el, func) {
  if (typeof el == 'string') {
    el = document.getElementById(el);
  }
  el.addEventListener('click', func, true);
  el.addEventListener('touchend', func, true);
};

/**
 * Load the Prettify CSS and JavaScript.
 */
Code.importPrettify = function() {
  //<link rel="stylesheet" href="../prettify.css">
  //<script src="../prettify.js"></script>
  var link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', '../prettify.css');
  document.head.appendChild(link);
  var script = document.createElement('script');
  script.setAttribute('src', '../prettify.js');
  document.head.appendChild(script);
};

/**
 * Compute the absolute coordinates and dimensions of an HTML element.
 * @param {!Element} element Element to match.
 * @return {!Object} Contains height, width, x, and y properties.
 * @private
 */
Code.getBBox_ = function(element) {
  var height = element.offsetHeight;
  var width = element.offsetWidth;
  var x = 0;
  var y = 0;
  do {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  } while (element);
  return {
    height: height,
    width: width,
    x: x,
    y: y
  };
};

/**
 * User's language (e.g. "en").
 * @type {string}
 */
Code.LANG = Code.getLang();
/**
 * List of tab names.
 * @private
 */
Code.TABS_ = ['blocks', 'xml', 'javascript', 'javascriptEd'];

Code.selected = 'blocks';

/**
 * Switch the visible pane when a tab is clicked.
 * @param {string} clickedName Name of tab clicked.
 */
Code.tabClick = function(clickedName) {
  // If the XML tab was open, save and render the content.
  if (document.getElementById('tab_xml').className == 'tabon') {
    var xmlTextarea = document.getElementById('content_xml');
    var xmlText = xmlTextarea.value;
    var xmlDom = null;
    try {
      xmlDom = Blockly.Xml.textToDom(xmlText);
    } catch (e) {
      var q =
          window.confirm(MSG['badXml'].replace('%1', e));
      if (!q) {
        // Leave the user on the XML tab.
        return;
      }
    }
    if (xmlDom) {
      Code.workspace.clear();
      Blockly.Xml.domToWorkspace(xmlDom, Code.workspace);
    }
  }

  if (document.getElementById('tab_blocks').className == 'tabon') {
    Code.workspace.setVisible(false);
  }
  // Deselect all tabs and hide all panes.
  for (var i = 0; i < Code.TABS_.length; i++) {
    var name = Code.TABS_[i];
    document.getElementById('tab_' + name).className = 'taboff';
    document.getElementById('content_' + name).style.visibility = 'hidden';
  }

  // Select the active tab.
  Code.selected = clickedName;
  document.getElementById('tab_' + clickedName).className = 'tabon';
  // Show the selected pane.
  document.getElementById('content_' + clickedName).style.visibility =
      'visible';
  Code.renderContent();
  if (clickedName == 'blocks') {
    Code.workspace.setVisible(true);
  }
  Blockly.svgResize(Code.workspace);
};

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
Code.renderContent = function() {
  var content = document.getElementById('content_' + Code.selected);
  // Initialize the pane.
  if (content.id == 'content_xml') {
    var xmlTextarea = document.getElementById('content_xml');
    var xmlDom = Blockly.Xml.workspaceToDom(Code.workspace);
    var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    xmlTextarea.value = xmlText;
    xmlTextarea.focus();
  } else if (content.id == 'content_javascript') {
    var code = Blockly.JavaScript.workspaceToCode(Code.workspace);
    content.textContent = code;
    if (typeof prettyPrintOne == 'function') {
      code = content.innerHTML;
      code = prettyPrintOne(code, 'js');
      content.innerHTML = code;
    }
  } else if (content.id == 'content_python') {
    code = Blockly.Python.workspaceToCode(Code.workspace);
    content.textContent = code;
    if (typeof prettyPrintOne == 'function') {
      code = content.innerHTML;
      code = prettyPrintOne(code, 'py');
      content.innerHTML = code;
    }
  } else if (content.id == 'content_php') {
    code = Blockly.PHP.workspaceToCode(Code.workspace);
    content.textContent = code;
    if (typeof prettyPrintOne == 'function') {
      code = content.innerHTML;
      code = prettyPrintOne(code, 'php');
      content.innerHTML = code;
    }
  } else if (content.id == 'content_dart') {
    code = Blockly.Dart.workspaceToCode(Code.workspace);
    content.textContent = code;
    if (typeof prettyPrintOne == 'function') {
      code = content.innerHTML;
      code = prettyPrintOne(code, 'dart');
      content.innerHTML = code;
    }
  } else if (content.id == 'content_lua') {
    code = Blockly.Lua.workspaceToCode(Code.workspace);
    content.textContent = code;
    if (typeof prettyPrintOne == 'function') {
      code = content.innerHTML;
      code = prettyPrintOne(code, 'lua');
      content.innerHTML = code;
    }
  }
};

/**
 * Initialize Blockly.  Called on page load.
 */
Code.init = function() {
  Code.initLanguage();
  
  var rtl = Code.isRtl();
  var container = document.getElementById('content_area');
  var onresize = function(e) {
    var bBox = Code.getBBox_(container);
    for (var i = 0; i < Code.TABS_.length; i++) {
      var el = document.getElementById('content_' + Code.TABS_[i]);
      el.style.top = bBox.y + 'px';
      el.style.left = bBox.x + 'px';
      // Height and width need to be set, read back, then set again to
      // compensate for scrollbars.
      el.style.height = bBox.height + 'px';
      el.style.height = (2 * bBox.height - el.offsetHeight) + 'px';
      el.style.width = bBox.width + 'px';
      el.style.width = (2 * bBox.width - el.offsetWidth) + 'px';
    }
    // Make the 'Blocks' tab line up with the toolbox.
    if (Code.workspace && Code.workspace.toolbox_.width) {
      document.getElementById('tab_blocks').style.minWidth =
          (Code.workspace.toolbox_.width - 38) + 'px';
          // Account for the 19 pixel margin and on each side.
    }
  };
  window.addEventListener('resize', onresize, false);

  var toolbox = document.getElementById('toolbox');
  Code.workspace = Blockly.inject('content_blocks',
      {grid:
          {spacing: 25,
           length: 3,
           colour: '#ccc',
           snap: true},
       media: '../../media/',
       rtl: rtl,
       toolbox: toolbox,
       zoom:
           {controls: true,
            wheel: true,
            startScale: Code.getWorkspaceStartScale()}
      });

  // Add to reserved word list: Local variables in execution environment (runJS)
  // and the infinite loop detection function.
  Blockly.JavaScript.addReservedWords('code,timeouts,checkTimeout');

 // Code.loadBlocks('');
//
//  if ('BlocklyStorage' in window) {
//    // Hook a save function onto unload.
//    BlocklyStorage.backupOnUnload(Code.workspace);
//  }

  Code.tabClick(Code.selected);

  //Code.bindClick('tab_blocks', function() { cpf.back(); });  // request for Acer
  
  Code.bindClick('trashButton', function() { trashBlocks();});
   var trashBTNid = document.getElementById('trashButton');
   trashBTNid.addEventListener('touchstart', function(e){
        var touchobj = e.changedTouches[0] // reference first touch point (ie: first finger)
        click_startx = parseInt(touchobj.clientX) // get x position of touch point relative to left edge of browser
//        cpfcall.logprint("touchstart: "+click_startx);
        
        e.preventDefault()
    }, false) 
      
  Code.bindClick('runButton',  Code.runJS);
  
  //(cpf)
  Code.bindClick('xmlCloudStore',
  function() {user.loadAopList();});

   var runBTNid = document.getElementById('xmlCloudStore');
   runBTNid.addEventListener('touchstart', function(e){
        var touchobj = e.changedTouches[0] // reference first touch point (ie: first finger)
        click_startx = parseInt(touchobj.clientX) // get x position of touch point relative to left edge of browser
        //cpf.logprint("touchstart: "+click_startx);
        
        e.preventDefault()
    }, false) 

  document.getElementById('linkButton').onclick = function(){resetBlocks();};

  document.getElementById('undoButton').onclick = function(){Code.workspace.undo(false);};
  document.getElementById('redoButton').onclick = function(){Code.workspace.undo(true); };

  // Disable the link button if page isn't backed by App Engine storage.
//  var linkButton = document.getElementById('linkButton');
//  if ('BlocklyStorage' in window) {
//    BlocklyStorage['HTTPREQUEST_ERROR'] = MSG['httpRequestError'];
//    BlocklyStorage['LINK_ALERT'] = MSG['linkAlert'];
//    BlocklyStorage['HASH_ERROR'] = MSG['hashError'];
//   BlocklyStorage['XML_ERROR'] = MSG['xmlError'];
//    Code.bindClick(linkButton,
//        function() {BlocklyStorage.link(Code.workspace);});
//  } else if (linkButton) {
//    linkButton.className = 'disabled';
//  }

  for (var i = 0; i < Code.TABS_.length; i++) {
    var name = Code.TABS_[i];
    Code.bindClick('tab_' + name,
        function(name_) {return function() {Code.tabClick(name_);};}(name));
  }
  onresize();
  Blockly.svgResize(Code.workspace);

//  Code.initLesson();
  // Lazy-load the syntax-highlighting.
  window.setTimeout(Code.importPrettify, 1);

  restoreBlocks();
  window.setTimeout(restoreBlocks, 1);

};

/**
 * Initialize the page language.
 */
Code.initLanguage = function() {
  // Set the HTML's language and direction.
  var rtl = Code.isRtl();
  document.dir = rtl ? 'rtl' : 'ltr';
  document.head.parentElement.setAttribute('lang', Code.LANG);

  // Sort languages alphabetically.
  var languages = [];
  for (var lang in Code.LANGUAGE_NAME) {
    languages.push([Code.LANGUAGE_NAME[lang], lang]);
  }
  var comp = function(a, b) {
    // Sort based on first argument ('English', 'Русский', '简体字', etc).
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
  };
  languages.sort(comp);
  // Populate the language selection menu.
  var languageMenu = document.getElementById('languageMenu');
  languageMenu.options.length = 0;
  for (var i = 0; i < languages.length; i++) {
    var tuple = languages[i];
    var lang = tuple[tuple.length - 1];
    var option = new Option(tuple[0], lang);
    if (lang == Code.LANG) {
      option.selected = true;
    }
    languageMenu.options.add(option);
  }
  languageMenu.addEventListener('change', Code.changeLanguage, true);
  
  // (CPF) Insert lesson menu
  var lessonMenu = '<select id="lessonMenu" onchange="changeLesson(this.value)">';
  for(var i = 0; i < MSG["lessonName"].length; i++) {
	  lessonMenu += '<option value=Arduino-'+ (i+1) +'>' + MSG["lessonName"][i];
	  if(i == MSG["lessonName"].length-1) {
		  lessonMenu += '</select>';
	  }
  }
  //////
  var lessonValue = Code.getStringParamFromUrl('lesson', '') || 'Arduino-1';  
	
  // Inject language strings.
  document.title += ' ' + MSG['title'];
  document.getElementById('title').textContent = MSG['title'];
  document.getElementById('tab_blocks').innerHTML = MSG['blocks'] + lessonMenu;
  
  // (CPF) Control panel msg
  document.getElementById('top_title').textContent = MSG['ControlPanelTitle'];
  // Scan CPF msg
  document.getElementById('cpf_title').textContent = MSG['ScanPanelTitle'];
  // Login msg
  document.getElementById('login_title').textContent = MSG['LoginTitle'];
  document.getElementById('login_act').textContent = MSG['LoginAct'];
  document.getElementById('login_btn').textContent = MSG['LoginButton'];
  // Cloud msg
  document.getElementById('cloud_title').innerHTML = MSG['CloudListTitle'];
  // CPF information msg
  document.getElementById('cpf_icon').textContent = MSG['CpfIcon'];
  document.getElementById('cpf_mac_title').textContent = MSG['CpfMacTitle'];
  document.getElementById('cpf_ver_title').textContent = MSG['CpfVerTitle'];
  document.getElementById('cpf_ip_title').textContent = MSG['CpfIpTitle'];
  document.getElementById('cpf_wifi_title').textContent = MSG['CpfWifiTitle'];
  document.getElementById('CPFsearch').textContent = MSG['CpfSearch'];
  
  // (CPF) Display now lesson on menu
  document.getElementById("lessonMenu").value = lessonValue;

  document.getElementById('linkButton').title = MSG['linkTooltip'];
  document.getElementById('runButton').title = MSG['runTooltip'];
  document.getElementById('trashButton').title = MSG['trashTooltip'];
  document.getElementById('undoButton').title = MSG['undoTooltip'];
  document.getElementById('redoButton').title = MSG['redoTooltip'];
  document.getElementById('xmlCloudStore').title = MSG['xmlCloudUploadTooltip'];
  
  var categories = ['catLogic', 'catLoops', 'catMath', 'catText', 'catLists',
                    'catColour', 'catVariables', 'catFunctions','catCPF', 'catHardwaeDevices', 'catInOut', 'catDigital', 'catAnalog', 'catCPFDevices', 'catCPFUI', 'catCPFAOP', 
                    'catCPFInDevices', 'catCPFInEnvironment', 'catCPFInSwitch', 'catCPFOutDevices', 
                    'catCPFOutSoundLight', 'catCPFOutRelay', 'catCPFOutMotors', 'catCPFOutDisplay'];
  for (var i = 0, cat; cat = categories[i]; i++) {
    document.getElementById(cat).setAttribute('name', MSG[cat]);
  }
  var textVars = document.getElementsByClassName('textVar');
  for (var i = 0, textVar; textVar = textVars[i]; i++) {
    textVar.textContent = MSG['textVariable'];
  }
  var listVars = document.getElementsByClassName('listVar');
  for (var i = 0, listVar; listVar = listVars[i]; i++) {
    listVar.textContent = MSG['listVariable'];
  }
};

/**
 * Execute the user's code.
 * Just a quick and dirty eval.  Catch infinite loops.
 */
Code.runJS = function() {

  var currentClickTime = new Date().getTime();
  if ((currentClickTime - lastClickTime) < clickTimeDelta) return;

  var code = Blockly.JavaScript.workspaceToCode(Code.workspace);
  if (Code.selected=='javascriptEd') code = document.getElementById('content_javascriptEd').value;
  //cpf.blocklyCon(code);
  //alert(code);  //for Android
  var pinreset = code.split('\n')[0].replace('cpf.pinreset("','{"request":[').replace('");',']}').replace(/\\/g,'');
  var uireset = code.split('\n')[2].replace('cpf.uireset("','{"request":[').replace('");',']}').replace(/\\/g,'');
  
  cpfcomponent.parse(uireset);
  
  document.getElementById("control_panel").style.display = 'inline';
  document.getElementById("control_panel").className = "slideLeft";
  $("#bg_dark").fadeIn(500);
  
  var cpfcode = code.replace(code.split('\n')[0], '').replace(code.split('\n')[1], '').replace(code.split('\n')[2], '');
  
  /*** cpf.sleep ***/
  var reg = RegExp("cpf.sleep");
  if(reg.test(cpfcode)) {
	cpfcode = getSleepCode(cpfcode);
	timer = 0;
	for(var i = 1; i < cpfcode.split("cpf.sleep").length; i++ ) {
		timer += getSleepTime(cpfcode, i);
	}
  }
  /******************/
  
  cpf.initArduino(pinreset);
  
  localStorage.init = pinreset;
  localStorage.code = cpfcode;
  
  console.log(uireset);
  console.log(cpfcode);

  lastclick_startx = 0;
};
// (cpf)
function getSleepCode(code) {
	
  var code = "async function wait() {" + code + "}wait();";
  var len = code.split("cpf.sleep").length - 1;
  
  for(var i = 1; i <= len; i++) {
	  var num = code.split("cpf.sleep", i).join("cpf.sleep").length;
	  code = code.splice(num, 0, "await ");
  }
  return code;
}

function getSleepTime(code, num) {
	var time = 0;
	var i = 1;
	var temp;
	while(true) {
		temp = time;
		time = Number(code.substr(code.split("cpf.sleep", num).join("cpf.sleep").length+10, i));
		i += 1;
		if(isNaN(time)) {
			return temp;
		}
	}
}

String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

/**
 * Discard all blocks from the workspace.
 */

 function clearBlocks(msg) {
   //  Fixed android called twice in WebView

   var currentClickTime = new Date().getTime();
   if ((currentClickTime - lastClickTime) < clickTimeDelta) return;

   var count = Code.workspace.getAllBlocks().length;
   if (msg === undefined) {
     msg = Blockly.Msg.DELETE_ALL_BLOCKS.replace('%1', count);
   }

   if (count < 1 ||
       window.confirm(msg)) {
     Code.workspace.clear();
     if (window.location.hash) {
       window.location.hash = '';
     }
     window.localStorage.removeItem('cpfarduinoblocks_'+lesson);
     return true;
   }
   else {
     return false;
   }
 }

Code.discard = function(msg) {

  var currentClickTime = new Date().getTime();
  if ((currentClickTime - lastClickTime) < clickTimeDelta) return;


  var count = Code.workspace.getAllBlocks().length;
  
  if (msg === undefined) {
    msg = Blockly.Msg.DELETE_ALL_BLOCKS.replace('%1', count);
  }

 if (count < 1 || window.confirm(msg)) {
    Code.workspace.clear();
    if (window.location.hash) {
      window.location.hash = '';
    }
        window.localStorage.removeItem('cpfarduinoblocks_'+lesson);
        return true;
  }
  else {
        return false;
  }
};

Code.showCode = function() {

  var currentClickTime = new Date().getTime();
  if ((currentClickTime - lastClickTime) < clickTimeDelta) return;

  var code = Blockly.JavaScript.workspaceToCode(Code.workspace);

   alert(code);  //for Android
  
};

/**
 * Undo blocks from the workspace.
 */
Code.undo = function(undoflag) {

 Code.workspace.undo(undoflag);
};

// (cpf)
Code.xmlCloudStore = function(num) {
    
  var currentClickTime = new Date().getTime();
  if ((currentClickTime - xmlCloudStore_lastClickTime) < xmlCloudStore_clickTime) return;

   xmlCloudStore_lastClickTime = currentClickTime;
   
  var xml = Blockly.Xml.workspaceToDom(Code.workspace);
  var data = Blockly.Xml.domToText(xml);
  
  // alert(data);  
  user.aopUpload(data, num);     //for CPF block
  
};

// (cpf)
function xmlUserFilePut(data) {
	
}


function sendJSCodeRequest() {

  var code = Blockly.JavaScript.workspaceToCode(Code.workspace);

  cpf.GetJSCode(code);    
};

/**
 * Parses the XML from its argument input to generate and replace the blocks
 * in the Blockly workspace.
 * @param {!string} blocksXml String of XML code for the blocks.
 * @return {!boolean} Indicates if the XML into blocks parse was successful.
 */
function replaceBlocksfromXml(blocksXml) {

  var xmlDom = null;
  try {
    xmlDom = Blockly.Xml.textToDom(blocksXml);
  } catch (e) {
    return false;
  }
  Code.workspace.clear();
  var sucess = false;
  if (xmlDom) {
    sucess = Code.loadBlocksfromXmlDom(xmlDom);
  }
  return sucess;
};


function trashBlocks() {
  // Fixed android called twice in WebView
  var currentClickTime = new Date().getTime();
  if ((currentClickTime - lastClickTime) < clickTimeDelta) return;

//   cpf.logprint("1.touchstart: "+click_startx);
//   cpf.logprint("2.lastclick_startx: "+lastclick_startx);

    if(click_startx == lastclick_startx) return;
    var rtstatus = clearBlocks();
 //   cpf.logprint("rtstatus: "+rtstatus);
   
    Code.renderContent();
    
    lastclick_startx = click_startx;
}

function resetBlocks() {
  // Fixed android called twice in WebView
  var currentClickTime = new Date().getTime();
  if ((currentClickTime - lastClickTime) < clickTimeDelta) return;

  if (clearBlocks(Blockly.Msg.DELETE_BLOCKS_LOAD_LESSON)) loadLocoalXmlFile(lesson);

}

function backupBlocks() {
  if ('localStorage' in window && Code.workspace.getAllBlocks().length > 0) {
    var xml = Blockly.Xml.workspaceToDom(Code.workspace);
    window.localStorage.setItem('cpfarduinoblocks_'+lesson, Blockly.Xml.domToText(xml));
  }
};

function restoreBlocks() {
  lesson = Code.getStringParamFromUrl('lesson', lesson);

  if ('localStorage' in window && window.localStorage['cpfarduinoblocks_'+lesson]) {
    Code.workspace.clear();
    var xml = Blockly.Xml.textToDom(window.localStorage['cpfarduinoblocks_'+lesson]);
    Blockly.Xml.domToWorkspace(xml, Code.workspace);

  }
  else {
    loadLocoalXmlFile(lesson);

 }
};
              
function loadLocoalXmlFile(newLesson) {
  var xmlDom = null;

  if (!newLesson) newLesson='Arduino-1';
  Code.workspace.clear();
  Code.renderContent();
  if (newLesson=='Arduino-1'){
    xmlDom = Blockly.Xml.textToDom(CPFArduino.Lesson1);
  }
  else if (newLesson=='Arduino-2'){
    xmlDom = Blockly.Xml.textToDom(CPFArduino.Lesson2);
  }
  else if (newLesson=='Arduino-3'){
    xmlDom = Blockly.Xml.textToDom(CPFArduino.Lesson3);
  }
  else if (newLesson=='Arduino-4'){
    xmlDom = Blockly.Xml.textToDom(CPFArduino.Lesson4);
  }
  else if (newLesson=='Arduino-5'){
    xmlDom = Blockly.Xml.textToDom(CPFArduino.Lesson5);
  }
  else if (newLesson=='Arduino-6'){
    xmlDom = Blockly.Xml.textToDom(CPFArduino.Lesson6);
  }
  else if (newLesson=='Arduino-7'){
    xmlDom = Blockly.Xml.textToDom(CPFArduino.Lesson7);
  }
  else if (newLesson=='Arduino-8'){
    xmlDom = Blockly.Xml.textToDom(CPFArduino.Lesson8);
  }
  else if (newLesson=='Arduino-9'){
    xmlDom = Blockly.Xml.textToDom(CPFArduino.Lesson9);
  }
  else {
    return;
  }

  if (xmlDom) {
//        Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xmlDom);
  Blockly.Xml.domToWorkspace(xmlDom, Code.workspace);
        lesson = newLesson;
 //     }
  }

}

/**
 * Parses the XML from its argument input to generate and add blocks to the
 * Blockly workspace.
 * @param {!string} blocksXmlDom String of XML DOM code for the blocks.
 * @return {!boolean} Indicates if the XML into blocks parse was successful.
 */
Code.loadBlocksfromXmlDom = function(blocksXmlDom) {
  try {
    Blockly.Xml.domToWorkspace(Code.workspace, blocksXmlDom);
  } catch (e) {
    return false;
  }
  return true;
};


document.write('<script src="../../examples/cpflesson.js"></script>\n');
// Load the Code demo's language strings.
document.write('<script src="msg/' + Code.LANG + '.js"></script>\n');
// Load Blockly's language strings.
document.write('<script src="../../msg/js/' + Code.LANG + '.js"></script>\n');

window.onunload  = function (e) { backupBlocks(); }
window.addEventListener('load', Code.init);
