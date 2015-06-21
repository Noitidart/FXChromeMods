const {interfaces: Ci, utils: Cu} = Components;
const core = {
	addon: {
		id: 'jid0-zDuE7MQZjTEpOLHPvhw3GbDyhIg@jetpack'
	}
};

Cu.import('resource://gre/modules/Services.jsm');

var aDOMWindow     = window.QueryInterface(Ci.nsIInterfaceRequestor)
						   .getInterface(Ci.nsIWebNavigation)
						   .QueryInterface(Ci.nsIDocShellTreeItem)
						   .rootTreeItem
						   .QueryInterface(Ci.nsIInterfaceRequestor)
						   .getInterface(Ci.nsIDOMWindow);
var aContentWindow = aDOMWindow.gBrowser ? aDOMWindow.gBrowser.contentWindow : aDOMWindow;
var gOverlay       = aContentWindow.document.getElementById('FXChromeMods_CP');

window.addEventListener('keyup', function(e) {
	console.error('iframe esc');
	if (e.keyCode == 27) { // ESC
		/*
		gOverlay.style.opacity = 0;
		gOverlay.addEventListener('transitionend', function() {
			gOverlay.parentNode.removeChild(gOverlay);
		}, false);
		*/
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
}, false);