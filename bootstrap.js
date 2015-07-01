// Imports
const {classes: Cc, interfaces: Ci, manager: Cm, results: Cr, utils: Cu, Constructor: CC} = Components;
Cm.QueryInterface(Ci.nsIComponentRegistrar);

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
const {TextDecoder, TextEncoder, OS} = Cu.import('resource://gre/modules/osfile.jsm', {});

// Globals
const core = {
	addon: {
		name: 'FXChromeMods',
		id: 'jid0-zDuE7MQZjTEpOLHPvhw3GbDyhIg@jetpack',
		path: {
			name: 'fxchromemods',
			content: 'chrome://fxchromemods/content/',
			locale: 'chrome://fxchromemods/locale/',
			resources: 'chrome://fxchromemods/content/resources/',
			images: 'chrome://fxchromemods/content/resources/images/'
		}
	},
	os: {
		name: OS.Constants.Sys.Name.toLowerCase()
	}
};

const NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
const NS_HTML = 'http://www.w3.org/1999/xhtml';

// Lazy Imports
const myServices = {};
XPCOMUtils.defineLazyGetter(myServices, 'hph', function () { return Cc['@mozilla.org/network/protocol;1?name=http'].getService(Ci.nsIHttpProtocolHandler); });
XPCOMUtils.defineLazyGetter(myServices, 'sb', function () { return Services.strings.createBundle(core.addon.path.locale + 'bootstrap.properties?' + Math.random()); /* Randomize URI to work around bug 719376 */ });

function extendCore() {
	// adds some properties i use to core
	switch (core.os.name) {
		case 'winnt':
		case 'winmo':
		case 'wince':
			core.os.version = parseFloat(Services.sysinfo.getProperty('version'));
			// http://en.wikipedia.org/wiki/List_of_Microsoft_Windows_versions
			if (core.os.version == 6.0) {
				core.os.version_name = 'vista';
			}
			if (core.os.version >= 6.1) {
				core.os.version_name = '7+';
			}
			if (core.os.version == 5.1 || core.os.version == 5.2) { // 5.2 is 64bit xp
				core.os.version_name = 'xp';
			}
			break;
			
		case 'darwin':
			var userAgent = myServices.hph.userAgent;
			//console.info('userAgent:', userAgent);
			var version_osx = userAgent.match(/Mac OS X 10\.([\d\.]+)/);
			//console.info('version_osx matched:', version_osx);
			
			if (!version_osx) {
				throw new Error('Could not identify Mac OS X version.');
			} else {
				var version_osx_str = version_osx[1];
				var ints_split = version_osx[1].split('.');
				if (ints_split.length == 1) {
					core.os.version = parseInt(ints_split[0]);
				} else if (ints_split.length >= 2) {
					core.os.version = ints_split[0] + '.' + ints_split[1];
					if (ints_split.length > 2) {
						core.os.version += ints_split.slice(2).join('');
					}
					core.os.version = parseFloat(core.os.version);
				}
				// this makes it so that 10.10.0 becomes 10.100
				// 10.10.1 => 10.101
				// so can compare numerically, as 10.100 is less then 10.101
				
				//core.os.version = 6.9; // note: debug: temporarily forcing mac to be 10.6 so we can test kqueue
			}
			break;
		default:
			// nothing special
	}
	
	core.os.toolkit = Services.appinfo.widgetToolkit.toLowerCase();
	core.os.xpcomabi = Services.appinfo.XPCOMABI;
	
	core.firefox = {};
	core.firefox.version = Services.appinfo.version;
	
	console.log('done adding to core, it is now:', core);
}

//start obs stuff
var observers = {
	'inline-options-shown': {
		observe: function (aSubject, aTopic, aData) {
			if (aData == core.addon.id) {
				obsHandler_inlineOptionsShown(aSubject, aTopic, aData);
			}
		},
		reg: function () {
			Services.obs.addObserver(observers['inline-options-shown'], 'addon-options-displayed', false);
		},
		unreg: function () {
			Services.obs.removeObserver(observers['inline-options-shown'], 'addon-options-displayed');
		}
	},
	'inline-options-hid': {
		observe: function (aSubject, aTopic, aData) {
			if (aData == core.addon.id) {
				obsHandler_inlineOptionsHid(aSubject, aTopic, aData);
			}
		},
		reg: function () {
			Services.obs.addObserver(observers['inline-options-hid'], 'addon-options-hidden', false);
		},
		unreg: function () {
			Services.obs.removeObserver(observers['inline-options-hid'], 'addon-options-hidden');
		}
	}
};
//end obs stuff

// START - Addon Functionalities
// start - about page
function AboutFXChromeMods() {}
AboutFXChromeMods.prototype = Object.freeze({
	classDescription: 'FXChromeMods Modification Selection Panel',
	contractID: '@mozilla.org/network/protocol/about;1?what=fxchrome',
	classID: Components.ID('{f224b1a0-17a2-11e5-b939-0800200c9a66}'),
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),

	getURIFlags: function(aURI) {
		return Ci.nsIAboutModule.ALLOW_SCRIPT;
	},

	newChannel: function(aURI) {
		let channel = Services.io.newChannel(core.addon.path.content + 'about_fxchrome.htm', null, null);
		channel.originalURI = aURI;
		return channel;
	}
});

function Factory(component) {
	this.createInstance = function(outer, iid) {
		if (outer) {
			throw Cr.NS_ERROR_NO_AGGREGATION;
		}
		return new component();
	};
	this.register = function() {
		Cm.registerFactory(component.prototype.classID, component.prototype.classDescription, component.prototype.contractID, this);
	};
	this.unregister = function() {
		Cm.unregisterFactory(component.prototype.classID, this);
	}
	Object.freeze(this);
	this.register();
}

var factory;
// end - about page

// start - observer handler - inline-options-shown
function obsHandler_inlineOptionsShown(aSubject, aTopic, aData) {
	
	console.error('in obsHandler_inlineOptionsShown');
	
	var contentDocument = aSubject;
	
	var overlay = contentDocument.createElementNS(NS_XUL, 'box');
	overlay.setAttribute('style', 'z-index:1; position:fixed; opacity:0; width:100%; height:100%; background:-moz-radial-gradient(rgba(127, 127, 127, 0.5), rgba(127, 127, 127, 0.5) 35%, rgba(0, 0, 0, 0.7)); transition:opacity 200ms; top:0; left:0;');

	overlay.setAttribute('id', 'FXChromeMods_CP');
	
	console.info('overlay:', overlay);
	
	var header = contentDocument.getElementById('header');
	console.info('header:', header);
	header.parentNode.insertBefore(overlay, header);
	
	
	
	var iframe = contentDocument.createElementNS(NS_HTML, 'iframe');
	iframe.setAttribute('flex', '1');
	iframe.setAttribute('style', 'overflow:hidden;width:100%;height:100%;');
	overlay.appendChild(iframe);
	
	iframe.setAttribute('type', 'chrome')
	iframe.setAttribute('src', core.addon.path.content + 'cp.xhtml');
	
	contentDocument.defaultView.addEventListener('keyup', function(e) {
		console.error('bootstrap esc');
		if (e.keyCode == 27) { // ESC
			console.log('overlay:', overlay);
			if (overlay.style.opacity != 0) {
				overlay.style.opacity = 0;
				contentDocument.defaultView.removeEventListener('keyup', arguments.callee, false);
				overlay.addEventListener('transitionend', function() {
					overlay.parentNode.removeChild(overlay);
				}, false);
			} else {
				// its not faded in, so just remove it, this happens in case xhr fails to read the json
				contentDocument.defaultView.setTimeout(function() {
					overlay.parentNode.removeChild(overlay);
				}, 1000); // need the timeout as apparnetly adding is async and the readfile happens faster then the adding amazing
			}
		}
	}, false);
}
// end - observer handler - inline-options-shown

// start - observer handler - inline-options-hid
function obsHandler_inlineOptionsHid(aSubject, aTopic, aData) {
	var contentDocument = aSubject;
}
// end - observer handler - inline-options-hid

// END - Addon Functionalities

function install() {}
function uninstall() {}

function startup(aData, aReason) {
	//core.addon.aData = aData;
	extendCore();
	factory = new Factory(AboutFXChromeMods);
	

	//start observers stuff more
	for (var o in observers) {
		observers[o].reg();
	}
	//end observers stuff more
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) { return }
	factory.unregister();
	
	//start observers stuff more
	for (var o in observers) {
		observers[o].unreg();
	}
	//end observers stuff more
}

// start - common helper functions
// end - common helper functions