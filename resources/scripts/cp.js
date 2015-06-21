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
            for (var p in selectProps) {
                $(p).addEventListener('change', callback(p), false);
            }
            window.addEventListener('keypress', messageEsc, false);
        }
        window.addEventListener('DOMContentLoaded', init, false)
        
        function callback(id) {
            return function() {
                toggleSelect(null, id)
            }
        }