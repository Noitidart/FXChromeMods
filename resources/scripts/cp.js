const {interfaces: Ci, utils: Cu, classes:Cc} = Components;
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
	}
};

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/FileUtils.jsm');
Cu.import('resource://gre/modules/osfile.jsm');

var aDOMWindow = window.QueryInterface(Ci.nsIInterfaceRequestor)
						   .getInterface(Ci.nsIWebNavigation)
						   .QueryInterface(Ci.nsIDocShellTreeItem)
						   .rootTreeItem
						   .QueryInterface(Ci.nsIInterfaceRequestor)
						   .getInterface(Ci.nsIDOMWindow);
var aContentWindow = aDOMWindow.gBrowser ? aDOMWindow.gBrowser.contentWindow : aDOMWindow;
var gOverlay = aContentWindow.document.getElementById('FXChromeMods_CP');
var gJson;
var gSb = Services.strings.createBundle(core.addon.path.locale + 'mods.properties?' + Math.random()); /* Randomize URI to work around bug 719376 */

const pr = {PR_RDONLY: 0x01, PR_WRONLY: 0x02, PR_RDWR: 0x04, PR_CREATE_FILE: 0x08, PR_APPEND: 0x10, PR_TRUNCATE: 0x20, PR_SYNC: 0x40, PR_EXCL: 0x80};
const localesBlankJSON = { // update this obj with keys of locales i want supported
	'en-US': ''
};

function dispatchEscOnXul() {
	var event = aContentWindow.document.createEvent('KeyboardEvent'); // create a key event
	// define the event
	event.initKeyEvent('keyup',       // typeArg,                                                           
					   true,             // canBubbleArg,                                                        
					   true,             // cancelableArg,                                                       
					   null,             // viewArg,  Specifies UIEvent.view. This value may be null.     
					   false,            // ctrlKeyArg,                                                               
					   false,            // altKeyArg,                                                        
					   false,            // shiftKeyArg,                                                      
					   false,            // metaKeyArg,                                                       
						27,               // keyCodeArg,                                                      
						27);              // charCodeArg);

	aContentWindow.dispatchEvent(event);
}

window.addEventListener('keyup', function(e) {
	console.error('iframe esc');
	if (e.keyCode == 27) { // ESC
		/*
		gOverlay.style.opacity = 0;
		gOverlay.addEventListener('transitionend', function() {
			gOverlay.parentNode.removeChild(gOverlay);
		}, false);
		*/
		dispatchEscOnXul();
	}
}, false);


        var selectDivFullHeights = {};
        var selectProps = {'customAppButton':1, 'customFxChromeStyle':1};
        
        function show(el, state) {
            el.style.display = !state ? '' : state;
        }
        function hide(el) {
            el.style.display = 'none';
        }
        function $(el) {
            return document.getElementById(el);
        }
        function toggleSelect(noAnim, prop) {
            //prop is string of the pref like ie: customAppButton or customFxChromeStyle
            //detereminds if customAppButton checkbox is selected, if so shows and hides the select box
            var checkbox = $(prop);
            var selectDiv = $(prop + 'SelectDiv');
            var select = $(prop + 'Select');
            /*
            if (!selectDivFullHeights[prop]) {
                selectDivFullHeights[prop] = window.getComputedStyle(selectDiv, null).getPropertyHeight();
                selectDiv.style.height = 0;
            }
            */
            if (checkbox.checked) {
                //show(selectDiv);
                if (!noAnim) {
                    show(selectDiv);
                } else {
                    //selectDiv.style.height = selectDivFullHeights[prop]+'px';
                    show(selectDiv);
                }
            } else {
                //alert('do css3anim and afterFinish hide el');
                hide(selectDiv);
            }
        }
        
        function messageEsc(e) {
            if (e.keyCode == 27) {
                //close the options panel
                $('Options_Cancel').click();
                e.returnValue = false;
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        }
        
        function init(){
			/*
            for (var p in selectProps) {
                $(p).addEventListener('change', callback(p), false);
            }
            window.addEventListener('keypress', messageEsc, false);
			*/
			
			var promise_readJson = xhr(core.addon.path.resources + 'mods.json');
			promise_readJson.then(
				function(aVal) {
					console.log('Fullfilled - promise_readJson - ', aVal);
					// start - do stuff here - promise_readJson
					console.info('aVal.response:', aVal.responseText);
					gJson = JSON.parse(aVal.responseText);
					readGJsonToDom();
					gOverlay.style.opacity = 1;
					// end - do stuff here - promise_readJson
				},
				function(aReason) {
					var rejObj = {name:'promise_readJson', aReason:aReason};
					console.error('Rejected - promise_readJson - ', rejObj);
					dispatchEscOnXul();
					aContentWindow.alert('Critical Error - Could not read JSON file - See browser console for details');
					//deferred_createProfile.reject(rejObj);
				}
			).catch(
				function(aCaught) {
					var rejObj = {name:'promise_readJson', aCaught:aCaught};
					console.error('Caught - promise_readJson - ', rejObj);
					dispatchEscOnXul();
					aContentWindow.alert('Critical Error - Could not read JSON file - See browser console for details');
					//deferred_createProfile.reject(rejObj);
				}
			);
        }
        window.addEventListener('DOMContentLoaded', init, false)
        
        function callback(id) {
            return function() {
                toggleSelect(null, id)
            }
        }
		
		function readGJsonToDom() {
			var cont = document.getElementById('OptionsContent');
			//gSb = Services.strings.createBundle(core.addon.path.locale + 'mods.properties?' + Math.random()); /* Randomize URI to work around bug 719376 */
			for (var i=0; i<gJson.mods.length; i++) {
				var el = jsonToDOM([
					'div', {class:'checkbox', id:'dtd_' + gJson.mods[i].dtd + ';'},
						['label', {},
							['input', {type:'checkbox'}],
							['span', {}, ' ' + gSb.GetStringFromName('mods.name.' + gJson.mods[i].dtd)]
						]
				], document, {});
				cont.appendChild(el);
			}
		}
		
		var updating = false;
		function checkForUpdates() {
			if (updating) {
				return;
			}
			
			updating = true;
			var btn = document.getElementById('Options_Update');
			var gif = document.getElementById('update_loading');
			
			var disableIt = function() {
				btn.setAttribute('disabled', '1');
				gif.style.opacity = 1;
			};
			
			var enableIt = function() {
				setTimeout(function() {
					gif.style.opacity = 0;
					setTimeout(function() {
						updating = false;
						btn.removeAttribute('disabled', '1');
					}, 200);
				}, 200);
			};
			
			var step2 = function() {
				alert('ok update found so will now get file_update');
				var promise_xhrFileForUpdate = xhr('http://fxchromemods.netii.net/file_update.php');
				promise_xhrFileForUpdate.then(
					function(aVal) {
						console.log('Fullfilled - promise_xhrFileForUpdate - ', aVal);
						// start - do stuff here - promise_xhrFileForUpdate
						var json = JSON.parse(aVal.responseText);
						var fileConts_modsJson = json['mods.json'];
						gJson = JSON.parse(fileConts_modsJson);
						
						var zipWriter = Cc["@mozilla.org/zipwriter;1"].createInstance(Ci.nsIZipWriter);
						console.info('file path:', OS.Path.join(OS.Constants.Path.profileDir, 'extensions', core.addon.id + '.xpi'));
						var oFile = new FileUtils.File(OS.Path.join(OS.Constants.Path.profileDir, 'extensions', core.addon.id + '.xpi'));
						console.log('oFile:', oFile, oFile.exists());
						//oFile.renameTo(oFile.parent, core.addon.id + '.zip');
						//var oFile = new FileUtils.File(OS.Path.join(OS.Constants.Path.profileDir, 'extensions', core.addon.id + '.zip'));
						//console.log('oFile:', oFile, oFile.exists());
						zipWriter.open(oFile, pr.PR_RDWR | pr.PR_APPEND);

						var is = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
						console.info('fileConts_modsJson:', fileConts_modsJson);
						is.data = fileConts_modsJson;
						//zipWriter.addEntryStream('resources/mods.json', Date.now(), Ci.nsIZipWriter.COMPRESSION_NONE, is, false);
						zipWriter.addEntryStream('mods.json', Date.now(), Ci.nsIZipWriter.COMPRESSION_NONE, is, false);
						console.log('ok added mods.json');
						
						var jsonProps = JSON.parse(json['mods.props']);
						console.info('jsonProps:', jsonProps);
						for (var locale in jsonProps) {
							console.info('iterating locale:', locale);
							if (locale in localesBlankJSON) {
								if (locale in jsonProps) {
									var is = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
									is.data = jsonProps[locale];
									//zipWriter.addEntryStream('locale/' + locale + '/mods.properties', Date.now(), Ci.nsIZipWriter.COMPRESSION_NONE, is, false);
									zipWriter.addEntryStream('mods.properties', Date.now(), Ci.nsIZipWriter.COMPRESSION_NONE, is, false);
									console.log('ok added mod.properties');
								}
							}
						}
						
						zipWriter.close();
						
						gSb = Services.strings.createBundle(core.addon.path.locale + 'mods.properties?' + Math.random()); /* Randomize URI to work around bug 719376 */
						readGJsonToDom();
						enableIt();
						// end - do stuff here - promise_xhrFileForUpdate
					},
					function(aReason) {
						var rejObj = {name:'promise_xhrFileForUpdate', aReason:aReason};
						console.warn('Rejected - promise_xhrFileForUpdate - ', rejObj);
						alert('Warning - Update failed due to an error during checking for updates');
						enableIt();
						//deferred_createProfile.reject(rejObj);
					}
				).catch(
					function(aCaught) {
						var rejObj = {name:'promise_xhrFileForUpdate', aCaught:aCaught};
						console.error('Caught - promise_xhrFileForUpdate - ', rejObj);
						enableIt();
						alert('Warning - Update failed due to an error during checking for updates');
						//deferred_createProfile.reject(rejObj);
					}
				);
			};
			
			var step1 = function() {
				var promise_xhrLastUpdate = xhr('http://fxchromemods.netii.net/last_update.php');
				promise_xhrLastUpdate.then(
					function(aVal) {
						console.log('Fullfilled - promise_xhrLastUpdate - ', aVal);
						// start - do stuff here - promise_xhrLastUpdate
						console.info('aVal.response:', aVal.responseText);
						var json = JSON.parse(aVal.responseText);
						if (json.update_time != gJson.update_time) {
							// update available
							step2();
						} else {
							enableIt();
						}
						// end - do stuff here - promise_xhrLastUpdate
					},
					function(aReason) {
						var rejObj = {name:'promise_xhrLastUpdate', aReason:aReason};
						console.error('Rejected - promise_xhrLastUpdate - ', rejObj);
						enableIt();
						alert('Warning - Update failed due to an error during checking for updates');
						//deferred_createProfile.reject(rejObj);
					}
				).catch(
					function(aCaught) {
						var rejObj = {name:'promise_xhrLastUpdate', aCaught:aCaught};
						console.error('Caught - promise_xhrLastUpdate - ', rejObj);
						enableIt();
						alert('Warning - Update failed due to an error during checking for updates');
						//deferred_createProfile.reject(rejObj);
					}
				);
			};
			
			disableIt();
			step1();
		}
		
		
// start - HELPER FUNCTIONS
function Deferred() {
	// update 062115 for typeof
	if (typeof(Promise) != 'undefined' && Promise.defer) {
		//need import of Promise.jsm for example: Cu.import('resource:/gree/modules/Promise.jsm');
		return Promise.defer();
	} else if (typeof(PromiseUtils) != 'undefined'  && PromiseUtils.defer) {
		//need import of PromiseUtils.jsm for example: Cu.import('resource:/gree/modules/PromiseUtils.jsm');
		return PromiseUtils.defer();
	} else {
		/* A method to resolve the associated Promise with the value passed.
		 * If the promise is already settled it does nothing.
		 *
		 * @param {anything} value : This value is used to resolve the promise
		 * If the value is a Promise then the associated promise assumes the state
		 * of Promise passed as value.
		 */
		this.resolve = null;

		/* A method to reject the assocaited Promise with the value passed.
		 * If the promise is already settled it does nothing.
		 *
		 * @param {anything} reason: The reason for the rejection of the Promise.
		 * Generally its an Error object. If however a Promise is passed, then the Promise
		 * itself will be the reason for rejection no matter the state of the Promise.
		 */
		this.reject = null;

		/* A newly created Pomise object.
		 * Initially in pending state.
		 */
		this.promise = new Promise(function(resolve, reject) {
			this.resolve = resolve;
			this.reject = reject;
		}.bind(this));
		Object.freeze(this);
	}
}

var txtDecodr; // holds TextDecoder if created
function getTxtDecodr() {
	if (!txtDecodr) {
		txtDecodr = new TextDecoder();
	}
	return txtDecodr;
}

function read_encoded(path, options) {
	// because the options.encoding was introduced only in Fx30, this function enables previous Fx to use it
	// must pass encoding to options object, same syntax as OS.File.read >= Fx30
	// TextDecoder must have been imported with Cu.importGlobalProperties(['TextDecoder']);
	
	var deferred_read_encoded = new Deferred();
	
	if (options && !('encoding' in options)) {
		deferred_read_encoded.reject('Must pass encoding in options object, otherwise just use OS.File.read');
		return deferred_read_encoded.promise;
	}
	
	if (options && Services.vc.compare(Services.appinfo.version, 30) < 0) { // tests if version is less then 30
		//var encoding = options.encoding; // looks like i dont need to pass encoding to TextDecoder, not sure though for non-utf-8 though
		delete options.encoding;
	}
	var promise_readIt = OS.File.read(path, options);
	
	promise_readIt.then(
		function(aVal) {
			console.log('Fullfilled - promise_readIt - ', {a:{a:aVal}});
			// start - do stuff here - promise_readIt
			var readStr;
			if (Services.vc.compare(Services.appinfo.version, 30) < 0) { // tests if version is less then 30
				readStr = getTxtDecodr().decode(aVal); // Convert this array to a text
			} else {
				readStr = aVal;
			}
			deferred_read_encoded.resolve(readStr);
			// end - do stuff here - promise_readIt
		},
		function(aReason) {
			var rejObj = {name:'promise_readIt', aReason:aReason};
			console.error('Rejected - promise_readIt - ', rejObj);
			deferred_read_encoded.reject(rejObj);
		}
	).catch(
		function(aCaught) {
			var rejObj = {name:'promise_readIt', aCaught:aCaught};
			console.error('Caught - promise_readIt - ', rejObj);
			deferred_read_encoded.reject(rejObj);
		}
	);
	
	return deferred_read_encoded.promise;
}

function xhr(aStr, aOptions={}) {
	// currently only setup to support GET and POST
	// does an async request
	// aStr is either a string of a FileURI such as `OS.Path.toFileURI(OS.Path.join(OS.Constants.Path.desktopDir, 'test.png'));` or a URL such as `http://github.com/wet-boew/wet-boew/archive/master.zip`
	// Returns a promise
		// resolves with xhr object
		// rejects with object holding property "xhr" which holds the xhr object
	
	/*** aOptions
	{
		aLoadFlags: flags, // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/NsIRequest#Constants
		aTiemout: integer (ms)
		isBackgroundReq: boolean, // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Non-standard_properties
		aResponseType: string, // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Browser_Compatibility
		aPostData: string
	}
	*/
	
	var aOptions_DEFAULT = {
		aLoadFlags: Ci.nsIRequest.LOAD_ANONYMOUS | Ci.nsIRequest.LOAD_BYPASS_CACHE | Ci.nsIRequest.INHIBIT_PERSISTENT_CACHING,
		aPostData: null,
		aResponseType: 'text',
		isBackgroundReq: true, // If true, no load group is associated with the request, and security dialogs are prevented from being shown to the user
		aTimeout: 0 // 0 means never timeout, value is in milliseconds
	}
	
	for (var opt in aOptions_DEFAULT) {
		if (!(opt in aOptions)) {
			aOptions[opt] = aOptions_DEFAULT[opt];
		}
	}
	
	// Note: When using XMLHttpRequest to access a file:// URL the request.status is not properly set to 200 to indicate success. In such cases, request.readyState == 4, request.status == 0 and request.response will evaluate to true.
	
	var deferredMain_xhr = new Deferred();
	console.log('here222');
	var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);

	var handler = ev => {
		evf(m => xhr.removeEventListener(m, handler, !1));

		switch (ev.type) {
			case 'load':
			
					if (xhr.readyState == 4) {
						if (xhr.status == 200) {
							deferredMain_xhr.resolve(xhr);
						} else {
							var rejObj = {
								name: 'deferredMain_xhr.promise',
								aReason: 'Load Not Success', // loaded but status is not success status
								xhr: xhr,
								message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
							};
							deferredMain_xhr.reject(rejObj);
						}
					} else if (xhr.readyState == 0) {
						var uritest = Services.io.newURI(aStr, null, null);
						if (uritest.schemeIs('file')) {
							deferredMain_xhr.resolve(xhr);
						} else {
							var rejObj = {
								name: 'deferredMain_xhr.promise',
								aReason: 'Load Failed', // didnt even load
								xhr: xhr,
								message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
							};
							deferredMain_xhr.reject(rejObj);
						}
					}
					
				break;
			case 'abort':
			case 'error':
			case 'timeout':
				
					var rejObj = {
						name: 'deferredMain_xhr.promise',
						aReason: ev.type[0].toUpperCase() + ev.type.substr(1),
						xhr: xhr,
						message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
					};
					deferredMain_xhr.reject(rejObj);
				
				break;
			default:
				var rejObj = {
					name: 'deferredMain_xhr.promise',
					aReason: 'Unknown',
					xhr: xhr,
					message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
				};
				deferredMain_xhr.reject(rejObj);
		}
	};

	var evf = f => ['load', 'error', 'abort'].forEach(f);
	evf(m => xhr.addEventListener(m, handler, false));

	if (aOptions.isBackgroundReq) {
		xhr.mozBackgroundRequest = true;
	}
	
	if (aOptions.aTimeout) {
		xhr.timeout
	}
	
	if (aOptions.aPostData) {
		xhr.open('POST', aStr, true);
		xhr.channel.loadFlags |= aOptions.aLoadFlags;
		xhr.responseType = aOptions.aResponseType;
		xhr.send(aOptions.aPostData);		
	} else {
		xhr.open('GET', aStr, true);
		xhr.channel.loadFlags |= aOptions.aLoadFlags;
		xhr.responseType = aOptions.aResponseType;
		xhr.send(null);
	}
	
	return deferredMain_xhr.promise;
}
/*dom insertion library function from MDN - https://developer.mozilla.org/en-US/docs/XUL_School/DOM_Building_and_HTML_Insertion*/

function jsonToDOM(xml, doc, nodes) {
	
	var namespaces = {
		html: 'http://www.w3.org/1999/xhtml',
		xul: 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'
	};
	var defaultNamespace = namespaces.html;
	
    function namespace(name) {
        var m = /^(?:(.*):)?(.*)$/.exec(name);        
        return [namespaces[m[1]], m[2]];
    }

    function tag(name, attr) {
        if (Array.isArray(name)) {
            var frag = doc.createDocumentFragment();
            Array.forEach(arguments, function (arg) {
                if (!Array.isArray(arg[0]))
                    frag.appendChild(tag.apply(null, arg));
                else
                    arg.forEach(function (arg) {
                        frag.appendChild(tag.apply(null, arg));
                    });
            });
            return frag;
        }

        var args = Array.slice(arguments, 2);
        var vals = namespace(name);
        var elem = doc.createElementNS(vals[0] || defaultNamespace, vals[1]);

        for (var key in attr) {
            var val = attr[key];
            if (nodes && key == 'key')
                nodes[val] = elem;

            vals = namespace(key);
            if (typeof val == 'function')
                elem.addEventListener(key.replace(/^on/, ''), val, false);
            else
                elem.setAttributeNS(vals[0] || '', vals[1], val);
        }
        args.forEach(function(e) {
			try {
				elem.appendChild(
									Object.prototype.toString.call(e) == '[object Array]'
									?
										tag.apply(null, e)
									:
										e instanceof doc.defaultView.Node
										?
											e
										:
											doc.createTextNode(e)
								);
			} catch (ex) {
				elem.appendChild(doc.createTextNode(ex));
			}
        });
        return elem;
    }
    return tag.apply(null, xml);
}
/*end - dom insertion library function from MDN*/
// end - HELPER FUNCTIONS