const {
	classes: Cc,
	interfaces: Ci,
	utils: Cu
} = Components;
const wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
const ww = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher);
const sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
const ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
const self = require('self');
const data = self.data;
const prefs = require('preferences-service');
const unload = require('unload');
const winUtils = require('window-utils');
const ss = require('simple-storage');
const notif = require("notifications");
const prefPrefix = 'extensions.fxchromemods.';
var p;
var iframe;
var aWin;
var iframeJs;
var winDelegate;
var winTracker;
var addonWin;
var addonTab;
var listenForManagerThenOpen;
var prefsOnCancel;
var origDoCommand;
var optionsClickedObserver;
var selectProps = {
	'customAppButton': 1,
	'customFxChromeStyle': 1
};
var fadePanelURI;
var skipCssPatt = /(?:customAppButton_.*?|customFxChromeStyle_.*?|utilitiesButton)/;
var css = {
	bookmarkSpaceSaver: data.url('mods/bookmarkSpaceSaver.css'),
	newTabPlus: data.url('mods/newTabPlus.css'),
	blueBackground: data.url('mods/blueBackground.css'),
	winXpIcons: data.url('mods/winXpIcons.css'),
	compactUbuntuIconSet: data.url('mods/compactUbuntuIconSet.css'),
	customAppButton: 'I21haW4td2luZG93ICNhcHBtZW51LWJ1dHRvbiwKI2FwcG1lbnUtdG9vbGJhci1idXR0b24gewogIGJhY2tncm91bmQ6IHtJQ09OX1VSTF9SRVBMQUNFfSAhaW1wb3J0YW50OwogIGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQgIWltcG9ydGFudDsKICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXIgYm90dG9tICFpbXBvcnRhbnQ7Cn0KCiNtYWluLXdpbmRvd1t0YWJzaW50aXRsZWJhcl0gI2FwcG1lbnUtYnV0dG9uIHsKICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXIgY2VudGVyICFpbXBvcnRhbnQ7Cn0KCiNtYWluLXdpbmRvd1twcml2YXRlYnJvd3Npbmdtb2RlPXRlbXBvcmFyeV0gI2FwcG1lbnUtYnV0dG9uLAojbWFpbi13aW5kb3dbdGFic2ludGl0bGViYXJdW3ByaXZhdGVicm93c2luZ21vZGU9dGVtcG9yYXJ5XSAjYXBwbWVudS1idXR0b24sCiNtYWluLXdpbmRvd1twcml2YXRlYnJvd3Npbmdtb2RlPXRlbXBvcmFyeV0gI2FwcG1lbnUtdG9vbGJhci1idXR0b24gewogIGJhY2tncm91bmQ6IHVybCgiY2hyb21lOi8vYnJvd3Nlci9za2luL1ByaXZhY3ktNDgucG5nIikgIWltcG9ydGFudDsKICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0ICFpbXBvcnRhbnQ7CiAgYmFja2dyb3VuZC1wb3NpdGlvbjogY2VudGVyIGJvdHRvbSAhaW1wb3J0YW50Owp9CgojbWFpbi13aW5kb3dbdGFic2ludGl0bGViYXJdW3ByaXZhdGVicm93c2luZ21vZGU9dGVtcG9yYXJ5XSAjYXBwbWVudS1idXR0b24gewogIGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQgIWltcG9ydGFudDsKICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXIgY2VudGVyICFpbXBvcnRhbnQ7Cn0=',
	customAppButton_FFNormal: data.url('mods/customAppButton_FFNormal.css'),
	customAppButton_None: data.url('mods/customAppButton_None.css'),
	conditionalBack: data.url('mods/conditionalBack.css'),
	customFxChromeStyle: null,
	customFxChromeStyle_Australis: data.url('mods/customFxChromeStyle_Australis.css'),
	customFxChromeStyle_Mac: data.url('mods/customFxChromeStyle_Mac.css'),
	customFxChromeStyle_Ux: data.url('mods/customFxChromeStyle_Ux.css'),
	utilitiesButton: null
}

function callback(counter) {
	return function () {
		check(counter);
	}
}
var onload = function () {
		iframe.removeEventListener('load', onload, false);
		open();
		iframe.contentDocument.getElementById('Options_Cancel').addEventListener('click', cancelAndClose, true);
		iframe.contentDocument.getElementById('Options_Save').addEventListener('click', close, true);
		iframeJs = new XPCNativeWrapper(iframe.contentWindow);
		var input = iframe.contentDocument.getElementsByTagName('input');
		for(var i = 0; i < input.length; i++) {
			if(input[i].type == 'checkbox') {
				input[i].addEventListener('change', callback(input[i].id), true);
				var prefVal = prefs.get(prefPrefix + input[i].id, false);
				if(prefVal == true) {
					input[i].checked = true;
					if(input[i].id in selectProps) {
						iframeJs.wrappedJSObject.toggleSelect(true, input[i].id);
						var selectBox = iframe.contentDocument.getElementById(input[i].id + 'Select');
						if(ss.storage['last' + input[i].id] !== undefined && ss.storage['last' + input[i].id] !== null) {
							for(var j = 0; j < selectBox.length; j++) {
								if(selectBox.options[j].value == ss.storage['last' + input[i].id]) {
									selectBox.selectedIndex = j;
									break;
								}
							}
						}
					}
				}
			}
		}
		for(var sp in selectProps) {
			iframe.contentDocument.getElementById(sp + 'Select').addEventListener('change', callback(sp), true);
		}
	};
function findManager() {
	var browserEnumerator = wm.getEnumerator('navigator:browser');
	var found = false;
	while(!found && browserEnumerator.hasMoreElements()) {
		var browserWin = browserEnumerator.getNext();
		var tabbrowser = browserWin.gBrowser;
		var numTabs = tabbrowser.browsers.length;
		for(var index = 0; index < numTabs; index++) {
			var currentBrowser = tabbrowser.getBrowserAtIndex(index);
			if(currentBrowser.contentDocument.getElementById('addons-page')) {
				found = true;
				break;
			}
		}
	}
	if(!found) {
		return false;
	}
	return {
		win: browserWin,
		tabbrowser: tabbrowser,
		tab: tabbrowser.tabContainer.childNodes[index]
	}
}
var setupAndOpen = function () {
		aWin = wm.getMostRecentWindow('navigator:browser');
		prefsOnCancel = {};
		for(var c in css) {
			if(c != 'utilitiesButton' && skipCssPatt.test(c)) {
				continue;
			}
			prefsOnCancel[c] = prefs.get(prefPrefix + c, null);
		}
		for(var sp in selectProps) {
			prefsOnCancel['last' + sp] = ss.storage['last' + sp] ? ss.storage['last' + sp] : null;
		}
		var preExisting = aWin.gBrowser.contentDocument.getElementById('FXChromeMods_Options');
		if(preExisting) {
			preExisting.parentNode.removeChild(preExisting);
		}
		p = aWin.document.createElement('box');
		p.setAttribute('style', 'z-index:1;position:fixed;opacity:0;width:100%;height:100%;background:-moz-radial-gradient(rgba(127, 127, 127, 0.5), rgba(127, 127, 127, 0.5) 35%, rgba(0, 0, 0, 0.7));');
		p.setAttribute('id', 'FXChromeMods_Options');
		iframe = aWin.document.createElement('iframe');
		iframe.setAttribute('flex', '1');
		iframe.setAttribute('style', 'overflow:hidden;width:100%;height:100%;');
		p.appendChild(iframe);
		iframe.addEventListener('load', onload, false);
		iframe.setAttribute('type', 'chrome')
		iframe.setAttribute('src', data.url('options.html'));
		var contentHbox = aWin.gBrowser.contentDocument.getElementById('header').nextSibling;
		contentHbox.insertBefore(p, contentHbox.childNodes[0]);
	}
var open = function () {
		var listener = function () {
				aWin.document.commandDispatcher.focusedElement = iframe;
			}
		p.addEventListener('animationend', listener, false);
		p.className = 'fadein_FxChromeModsPanel';
	}
var close = function () {
		var listener = function () {
				p.parentNode.removeChild(p);
			}
		p.addEventListener('animationend', listener, false);
		p.className = 'fadeout_FxChromeModsPanel';
	}
var cancelAndClose = function () {
		for(var sp in selectProps) {
			ss.storage['last' + sp] = prefsOnCancel['last' + sp];
			delete prefsOnCancel['last' + sp];
		}
		for(var p in prefsOnCancel) {
			if(prefsOnCancel[p] === null) {
				prefs.reset(prefPrefix + p);
			} else {
				prefs.set(prefPrefix + p, prefsOnCancel[p]);
			}
		}
		prefsOnCancel = undefined;
		applyBasedOnPrefs();
		close();
	}

function check(id) {
	var uri;
	var el = iframe.contentDocument.getElementById(id);
	var tag = el.tagName.toLowerCase();
	var trueFalse;
	if(tag == 'input') {
		trueFalse = iframe.contentDocument.getElementById(id).checked;
		prefs.set(prefPrefix + id, trueFalse);
		applyBasedOnPrefs(id, !trueFalse);
	} else if(tag == 'select') {
		applyBasedOnPrefs(id);
	} else {
		return;
	}
}

function utilitiesButtonRemover(aSubject) {
	var uBut = aSubject.document.getElementById('appmenu-button-fxchrome');
	if(uBut) {
		var appButton = aSubject.document.getElementById('appmenu-button');
		if(!appButton) {
			appButton = aSubject.document.getElementById('appmenu-toolbar-button');
		}
		var appmenuPopup = aSubject.document.getElementById('appmenu-popup');
		appmenuPopup.parentNode.removeChild(appmenuPopup);
		uBut.parentNode.removeChild(uBut);
		appButton.appendChild(appmenuPopup);
	} else {}
}

function utilitiesButtonWindowObserver() {
	this.observe = function (aSubject, aTopic, aData) {
		var applyFunc = function () {
				aSubject.removeEventListener('DOMContentLoaded', applyFunc, false);
				var navBar = aSubject.document.getElementById('nav-bar');
				if(navBar) {
					if(!aSubject.document.getElementById('appmenu-button-fxchrome')) {
						var appmenuPopup = aSubject.document.getElementById('appmenu-popup');
						appmenuPopup.parentNode.removeChild(appmenuPopup);
						var uBut = aSubject.document.createElement('toolbarbutton');
						uBut.setAttribute('id', 'appmenu-button-fxchrome');
						uBut.setAttribute('style', 'list-style-image: url("chrome://mozapps/skin/extensions/utilities.png") !important;');
						uBut.setAttribute('class', 'toolbarbutton-1 chromeclass-toolbar-additional');
						uBut.setAttribute('type', 'menu');
						uBut.setAttribute('label', 'Utilities');
						uBut.setAttribute('removable', 'true');
						uBut.appendChild(appmenuPopup);
						navBar.appendChild(uBut);
					} else {}
				} else {}
			}
			if(aTopic == 'domwindowclosed') {} else if(aTopic == 'alreadyopenedwindow') {
				applyFunc();
			} else if(aTopic == 'domwindowopened') {
				aSubject.addEventListener('DOMContentLoaded', applyFunc, false);
			} else {}
	}
}

function applyBasedOnPrefs(titleOfSingle, forceRemove) {
	var cWin = wm.getMostRecentWindow('navigator:browser');
	var adjustTabsPos = function () {
			var browserEnumerator = wm.getEnumerator('navigator:browser');
			while(browserEnumerator.hasMoreElements()) {
				var bWin = browserEnumerator.getNext();
				bWin.TabsInTitlebar._sizePlaceholder('appmenu-button', bWin.document.getElementById('appmenu-button-container').getBoundingClientRect().width);
			}
		};
	for(var c in css) {
		if(c == 'utilitiesButton') {
			var browserEnumerator = wm.getEnumerator('navigator:browser');
			if(prefs.get(prefPrefix + c, false) == false || forceRemove) {
				try {
					ww.unregisterNotification(utilitiesButtonObserver);
				} catch(ex) {}
				while(browserEnumerator.hasMoreElements()) {
					var bWin = browserEnumerator.getNext();
					if(bWin.document.getElementById('appmenu-button')) {
						utilitiesButtonRemover(bWin);
					}
				}
			} else {
				utilitiesButtonObserver = new utilitiesButtonWindowObserver();
				ww.registerNotification(utilitiesButtonObserver);
				while(browserEnumerator.hasMoreElements()) {
					var bWin = browserEnumerator.getNext();
					utilitiesButtonObserver.observe(bWin, 'alreadyopenedwindow')
				}
			}
		}
		if(titleOfSingle != null) {
			if(c != titleOfSingle) {
				continue;
			}
		}
		if(skipCssPatt.test(c)) {
			continue;
		}
		if(c == 'customAppButton') {
			var defaultBgImg = 'url("chrome://browser/skin/tabbrowser/firefox-32-noshadow.png")';
			var appButton = cWin.document.getElementById('appmenu-button');
			if(!appButton) {
				appButton = cWin.document.getElementById('appmenu-toolbar-button');
			}
			var currentBgImg = cWin.getComputedStyle(appButton, '').getPropertyValue('background-image');
			if(prefs.get(prefPrefix + c, false) == false || forceRemove) {
				if(currentBgImg == defaultBgImg) {} else {
					if(/-moz-linear-gradient/.test(currentBgImg)) {
						uri = ios.newURI(css['customAppButton_FFNormal'], null, null);
						if(sss.sheetRegistered(uri, sss.USER_SHEET)) {
							sss.unregisterSheet(uri, sss.USER_SHEET);
							adjustTabsPos();
							if(!forceRemove) {
								ss.storage.lastcustomAppButton = null;
							}
						} else {}
					} else if(currentBgImg == 'none') {
						uri = ios.newURI(css['customAppButton_None'], null, null);
						if(sss.sheetRegistered(uri, sss.USER_SHEET)) {
							sss.unregisterSheet(uri, sss.USER_SHEET);
							adjustTabsPos();
							if(!forceRemove) {
								ss.storage.lastcustomAppButton = null;
							}
						} else {}
					} else {
						var modified_css = 'data:text/css;base64,' + cWin.btoa(cWin.atob(css[c]).replace('{ICON_URL_REPLACE}', currentBgImg));
						uri = ios.newURI(modified_css, null, null);
						if(sss.sheetRegistered(uri, sss.USER_SHEET)) {
							sss.unregisterSheet(uri, sss.USER_SHEET);
							if(!forceRemove) {
								ss.storage.lastcustomAppButton = null;
							}
						} else {}
					}
				}
			} else {
				if((!iframe || !iframe.contentDocument) || prefsOnCancel === undefined) {
					var newBgImg = ss.storage.lastcustomAppButton;
				} else if((!iframe || !iframe.contentDocument) && prefsOnCancel !== undefined) {
					var newBgImg = ss.storage.lastcustomAppButton;
				} else if(iframe && iframe.contentDocument) {
					var newBgImg = iframe.contentDocument.getElementById('customAppButtonSelect').value;
				} else {
					return;
				}
				if(newBgImg == 'customAppButton_FFNormal') {
					uri = ios.newURI(css['customAppButton_FFNormal'], null, null);
				} else if(newBgImg == 'customAppButton_None') {
					uri = ios.newURI(css['customAppButton_None'], null, null);
				} else if(customApp_imgs[newBgImg]) {
					newBgImgURL = 'url("' + customApp_imgs[newBgImg] + '")';
					var modified_css = 'data:text/css;base64,' + cWin.btoa(cWin.atob(css[c]).replace('{ICON_URL_REPLACE}', newBgImgURL));
					uri = ios.newURI(modified_css, null, null);
				} else if(/^chrome\:\/\//m.test(newBgImg)) {
					newBgImgURL = 'url("' + newBgImg + '")';
					var modified_css = 'data:text/css;base64,' + cWin.btoa(cWin.atob(css[c]).replace('{ICON_URL_REPLACE}', newBgImgURL));
					uri = ios.newURI(modified_css, null, null);
				} else {
					return;
				}
				if(sss.sheetRegistered(uri, sss.USER_SHEET)) {
					ss.storage.lastcustomAppButton = newBgImg;
					continue;
				}
				if(currentBgImg == '-moz-linear-gradient(rgb(247, 182, 82), rgb(215, 98, 10) 95%)') {
					possibleCurrentUri = ios.newURI(css['customAppButton_FFNormal'], null, null);
				} else if(currentBgImg == 'none') {
					possibleCurrentUri = ios.newURI(css['customAppButton_None'], null, null);
				} else {
					var modified_css = 'data:text/css;base64,' + cWin.btoa(cWin.atob(css[c]).replace('{ICON_URL_REPLACE}', currentBgImg));
					possibleCurrentUri = ios.newURI(modified_css, null, null);
				}
				if(sss.sheetRegistered(possibleCurrentUri, sss.USER_SHEET)) {
					sss.unregisterSheet(possibleCurrentUri, sss.USER_SHEET);
					if(/-moz-linear-gradient/.test(currentBgImg) || currentBgImg == 'none') {
						adjustTabsPos();
					}
				} else {}
				sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
				if(newBgImg == 'customAppButton_FFNormal' || newBgImg == 'customAppButton_None') {
					adjustTabsPos();
				}
				ss.storage.lastcustomAppButton = newBgImg;
			}
		} else if(c == 'customFxChromeStyle') {
			var currentStyle;
			if(ss.storage.lastcustomFxChromeStyle) {
				possibleCurrentUri = ios.newURI(css[ss.storage.lastcustomFxChromeStyle], null, null);
				if(sss.sheetRegistered(possibleCurrentUri, sss.USER_SHEET)) {
					currentStyle = ss.storage.lastcustomFxChromeStyle;
				}
			}
			if(!currentStyle) {
				for(var sub_c in css) {
					if(sub_c.indexOf('customFxChromeStyle_') != 0) {
						continue;
					}
					if(sub_c == ss.storage.lastcustomFxChromeStyle) {
						continue;
					}
					possibleCurrentUri = ios.newURI(css[sub_c], null, null);
					if(sss.sheetRegistered(possibleCurrentUri, sss.USER_SHEET)) {
						currentStyle = sub_c;
						break;
					}
				}
			}
			var newStyle;
			if(!forceRemove && prefs.get(prefPrefix + c, false) == true) {
				if((!iframe || !iframe.contentDocument) || prefsOnCancel === undefined) {
					var newStyle = ss.storage.lastcustomFxChromeStyle;
				} else if((!iframe || !iframe.contentDocument) && prefsOnCancel !== undefined) {
					var newStyle = ss.storage.lastcustomFxChromeStyle;
				} else if(iframe && iframe.contentDocument) {
					var newStyle = iframe.contentDocument.getElementById('customFxChromeStyleSelect').value;
				} else {
					return;
				}
			}
			if(prefs.get(prefPrefix + c, false) == false || forceRemove || (newStyle && currentStyle != newStyle)) {
				if(!currentStyle) {} else {
					sss.unregisterSheet(possibleCurrentUri, sss.USER_SHEET);
					if(!forceRemove) {
						ss.storage.lastcustomFxChromeStyle = null;
					}
				}
			}
			if(newStyle) {
				if(currentStyle == newStyle) {} else {
					uri = ios.newURI(css[newStyle], null, null);
					sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
					ss.storage.lastcustomFxChromeStyle = newStyle;
				}
			} else {}
		} else {
			if(prefs.get(prefPrefix + c, false) && !forceRemove) {
				uri = ios.newURI(css[c], null, null);
				if(!sss.sheetRegistered(uri, sss.USER_SHEET)) {
					sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
				} else {}
			} else {
				uri = ios.newURI(css[c], null, null);
				if(sss.sheetRegistered(uri, sss.USER_SHEET)) {
					sss.unregisterSheet(uri, sss.USER_SHEET);
				} else {}
			}
		}
		if(titleOfSingle !== null && c == titleOfSingle) {
			return;
		}
	}
}

function observeWinLoad(e) {
	var win = e.originalTarget.defaultView;
	if(win.frameElement) {} else {
		if(win.location == 'about:addons') {
			addonWin = win;
			origDoCommand = win.uneval(win.gViewController.commands.cmd_showItemPreferences.doCommand);
			if(origDoCommand.indexOf('showSelfContainedOptionsPanel') >= 0) {
				origDoCommand = null;
			} else {
				win.gViewController.commands.cmd_showItemPreferences.doCommand = win.eval(origDoCommand.replace('"use strict";', '"use strict";if(aAddon.optionsURL == "showSelfContainedOptionsPanel"){Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService).notifyObservers(null, "showSelfContainedOptionsPanel", aAddon.id);return;}'));
			}
			if(listenForManagerThenOpen) {
				var xpc = new XPCNativeWrapper(win);
				listenForManagerThenOpen = false;
				if(xpc.wrappedJSObject.gViewController.currentViewId == 'addons://list/extension' && !xpc.wrappedJSObject.gViewController.isLoading) {
					setupAndOpen();
				} else {
					xpc.wrappedJSObject.gViewController.loadView('addons://list/extension');
					var extViewLoaded = function () {
							xpc.wrappedJSObject.gViewController.viewPort.removeEventListener('ViewChanged', extViewLoaded, false);
							setupAndOpen();
						};
					xpc.wrappedJSObject.gViewController.viewPort.addEventListener('ViewChanged', extViewLoaded, false);
					return;
				}
			}
		}
	}
}
var cDumpToTab = function (obj) {
		var tstr = '';
		var bstr = '';
		var fstr = '';
		for(var b in obj) {
			try {
				bstr += b + '=' + obj[b] + '\n';
			} catch(e) {
				fstr = b + '=' + e + '\n';
			}
		}
		tstr += '<b>BSTR::</b>\n' + bstr;
		tstr += '\n<b>FSTR::</b>\n' + fstr;
		var cWin = wm.getMostRecentWindow('navigator:browser');
		var onloadFunc = function () {
				cWin.gBrowser.selectedTab = cWin.gBrowser.tabContainer.childNodes[cWin.gBrowser.tabContainer.childNodes.length - 1];
				newTabBrowser.removeEventListener('load', onloadFunc, true);
				newTabBrowser.contentDocument.body.innerHTML = tstr.replace(/\n/g, '<br>')
			};
		var newTabBrowser = cWin.gBrowser.getBrowserForTab(cWin.gBrowser.addTab('about:blank'));
		newTabBrowser.addEventListener('load', onloadFunc, true);
	};
function myObserver() {
	this.register();
}
myObserver.prototype = {
	observe: function (subject, topic, data) {
		if(data == self.id) {
			setupAndOpen();
		}
	},
	register: function () {
		var observerService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
		observerService.addObserver(this, 'showSelfContainedOptionsPanel', false);
	},
	unregister: function () {
		var observerService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
		observerService.removeObserver(this, 'showSelfContainedOptionsPanel');
	}
};
unload.when(function (reason) {
	optionsClickedObserver.unregister();
	if(['disable', 'uninstall'].indexOf(reason) > -1) {
		applyBasedOnPrefs(null, true);
		if(sss.sheetRegistered(fadePanelURI, sss.USER_SHEET)) {
			sss.unregisterSheet(fadePanelURI, sss.USER_SHEET);
		} else {}
	}
	if(['uninstall'].indexOf(reason) > -1) {
		for(var c in css) {
			if(c.indexOf('customAppButton_') == 0) {
				continue;
			}
			prefs.reset(prefPrefix + c)
		}
		delete ss.storage.lastcustomAppButton;
	}
});
exports.main = function (options, callbacks) {
	optionsClickedObserver = new myObserver();
	var manager = findManager();
	if(!manager) {
		var cWin = wm.getMostRecentWindow('navigator:browser');
	} else {
		var cWin = manager.win;
	}
	if(['upgrade', 'downgrade', 'startup', 'install', 'enable'].indexOf(options.loadReason) > -1) {
		applyBasedOnPrefs();
		winDelegate = {
			onTrack: function (window) {
				if(!window.gBrowser) {
					return
				}
				window.gBrowser.addEventListener('load', observeWinLoad, true);
			},
			onUntrack: function (window) {
				if(!window.gBrowser) {
					return
				}
				window.gBrowser.removeEventListener('load', observeWinLoad, true);
			}
		};
		winTracker = new winUtils.WindowTracker(winDelegate);
		fadePanelURI = ios.newURI(data.url('style/fadePanel.css'), null, null);
		if(!sss.sheetRegistered(fadePanelURI, sss.USER_SHEET)) {
			sss.loadAndRegisterSheet(fadePanelURI, sss.USER_SHEET);
		} else {}
		if(manager) {
			addonWin = manager.win.gBrowser.getBrowserForTab(manager.tab);
			origDoCommand = addonWin.contentWindow.uneval(addonWin.contentWindow.gViewController.commands.cmd_showItemPreferences.doCommand);
			if(origDoCommand.indexOf('showSelfContainedOptionsPanel') >= 0) {
				origDoCommand = null;
			} else {
				addonWin.contentWindow.gViewController.commands.cmd_showItemPreferences.doCommand = addonWin.contentWindow.eval(origDoCommand.replace('"use strict";', '"use strict";if(aAddon.optionsURL == "showSelfContainedOptionsPanel"){Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService).notifyObservers(null, "showSelfContainedOptionsPanel", aAddon.id);return;}'));
			}
		}
	}
	if(['install'].indexOf(options.loadReason) > -1) {
		if(manager) {
			manager.win.focus();
			manager.win.gBrowser.selectedTab = manager.tab;
			cWin = manager.win;
			var xpc = new XPCNativeWrapper(cWin.gBrowser.contentWindow);
			if(xpc.wrappedJSObject.gViewController.currentViewId == 'addons://list/extension') {
				setupAndOpen();
			} else {
				xpc.wrappedJSObject.gViewController.loadView('addons://list/extension');
				var extViewLoaded = function () {
						xpc.wrappedJSObject.gViewController.viewPort.removeEventListener('ViewChanged', extViewLoaded, false);
						setupAndOpen();
					};
				xpc.wrappedJSObject.gViewController.viewPort.addEventListener('ViewChanged', extViewLoaded, false);
				return;
			}
		} else {
			cWin = wm.getMostRecentWindow('navigator:browser');
			listenForManagerThenOpen = true;
			cWin.BrowserOpenAddonsMgr();
		}
	}
	if(['downgrade', 'upgrade'].indexOf(options.loadReason) > -1) {
		notif.notify({
			title: 'FXChromeMods - ' + options.loadReason.replace(/./, function ($0) {
				return $0.toUpperCase()
			}) + 'd',
			text: 'Click here to open the options panel and see what\'s new!',
			iconURL: data.url('icon48.png'),
			onClick: function (data) {
				var manager = findManager();
				if(!manager) {
					var cWin = wm.getMostRecentWindow('navigator:browser');
				} else {
					var cWin = manager.win;
				}
				if(manager) {
					manager.win.focus();
					manager.win.gBrowser.selectedTab = manager.tab;
					cWin = manager.win;
					var xpc = new XPCNativeWrapper(cWin.gBrowser.contentWindow);
					if(xpc.wrappedJSObject.gViewController.currentViewId == 'addons://list/extension') {
						setupAndOpen();
					} else {
						xpc.wrappedJSObject.gViewController.loadView('addons://list/extension');
						var extViewLoaded = function () {
								xpc.wrappedJSObject.gViewController.viewPort.removeEventListener('ViewChanged', extViewLoaded, false);
								setupAndOpen();
							};
						xpc.wrappedJSObject.gViewController.viewPort.addEventListener('ViewChanged', extViewLoaded, false);
						return;
					}
				} else {
					cWin = wm.getMostRecentWindow('navigator:browser');
					listenForManagerThenOpen = true;
					cWin.BrowserOpenAddonsMgr();
				}
			}
		});
	}
};
var customApp_imgs = {
	alien: "data:image/png;base64,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",
	awesome: "data:image/png;base64,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",
	burger: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAfCAYAAACLSL/LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAuKSURBVFhH3VhpVFRHFs7MJAYVBRRRQdlUQNQOICi2RED2rZGt2RpZBA1pBaKyi8jmhkEFWUUFMYoCMYBoEgVBUGmazQ0T9yUqyOKaRE30m1s9Tc6cUZLM8mveOd+p97rr1f3qu7fq3nrvvfd/dv2F5jOI9+me4QMpZKgdRmDth9J71v6N8Ffpe/8zORgJNigbnJEYZjlbUy7UwVAzzo3rnCW0Xl0QYZNTEGF3qCTeua4i2bW1Is1VvD+OV797pd3BvHC79BSBma/AiqMhJczGGJzYf0RykNAHurrjZIU8I8Ptyxau3RvtcPT4dr8e0cGYV1ePb0ZXVSJu1m/D00vFeHy+EM9vV+Hp5SI8OpeH/vZs3GnYgK7KWNRnBzwtiLAvFzoazSM2w6UTZTb+9MU6M3WGhzrpczI/td5WtdH9Tkd51C/3mvPw/PtD+PFGOV48PI3XT6/gh6atuF8biYGWFPSeTkKfeAt6m5LRdyYV/c1peNyegUcdO9DduAE/nFiHEzsW/5Tqbx5J44+UeuBPkWOEPvQ1n6WdE2pd1nkk48XT+xfwy5OreNHTiOfns9B/JhHd9dHorluNhw3R6G2Mwa2vo9Gyxws3jy3Hw1Ox6G+Kxf26SPTURaOnPpb+46OrXIgfb1WTsoUQFYci2oMbIFWOhcmQF2PNfC8T42bsfyTDp6+nJY/I1OP59S/R25KBW0fCcemAD24fFeJhUxx6GmPRczIaDxvj8ehKFa58HUeKRNJ/8bhWvQLnyiJw8UAouk/G4O63q9DXsgkD53eSezeSm3fiYKLLHQ2lkeOli2RI1RjrERE8I99ThcLXT2iAx+JN6KmNwL0TK0idaAxcLMbDzt24VRtHSsWgp2ENgQjWxhK5OPSdjiey9Ewq3jubg4HLZeS+BOpL/RvXkJJx6CV0E65VLcfhZB585ml7SF36TtUY22GzVFQmHU73e/CoPRN9TWtoplFkhFSpjyEV1qG/NRMD7VkUR4kS45L/GMhQD7mPtcwou++l/r2NTM01eHw2ibCW3B+H6zUR5FYBRIXeOJ7BR7DNLCHZlpfG9FvulKgV6WGy9HJ1DAbO0swphlhs/GacyPXUriLXERpWE5hisRJjEtWYGqRY35kEisEkPBGtQV9zAu6Rqy9XfAJxsQBnCrxwJt+TSPmgbY8fvv3cHQGWesFkW2EoYiy2xiT4may/XvUZnogTMUAGBk4zIwmkHrtnroj/Byimek+tISJr8YiUYH26qW83kb9zbCWukpvOl4bg5NZFqEmxwzebHXE6m48WItSyyxetuwUQk2qHEvlPp09U/JjZ/j3Fxq3gGa49nu6GjhI/XKSBr1cKJdLfOBqGm0cjSC0KbFLpQW0UrcJwXKtcju9Kl6G9ZDEZ9EZLPp8U4UO00xPN9CwilTr2++NceSA6yoMk/drIha15Pji20RWrXObuIkJTCKMI7wx+pthY42nKlhUJvJdNOa5o2L4ItVtccGKzE46nO+KbNHvUbuVRfHiitYgGLyGU+qGtzA8dFf4So607fSHKJlcRTm1zR22qK2piHFAWYoEv7OdiT4AZdiU6IT/K7vUyN+NKsmlEUGE7wVDE2N4lR9BKCTQ/0VwgQFuxF9qKfNF5KACdlTTbQ4EQfyFA005vnEwng1FOOLzUEgf5C1DC5aBIYIqCODvkxNoha4MD0rTVkTRCFlvkFHBAdSp2TZyM7DBLHPghERW3U9+kl4d8J4yz22DrxtG3suIomZqqMXJvrUwm4wjGfsoEBdvSBJf+uk3uv36Z6PSm2NkI+WZ6yJo3A+laGkhQHI/1SopIVhiDNTIjkSQzHMkGOsio8cXWuiDsaAhAbudy7G5ahj0JDiheYYtDa13wxdFlONSXitLbCcipD8W+rjgUt0Zie9XSX9fneh21cuEoDRVnv6mmMU7ObTHfqHTHSeHr3BhSYNQobBkuhxLNaWi3sUKPvwdq9Q2Qpa+Fgt3eyLsRjqyOYGSLl6LwUhh2XV2N4u54FA2koOjxehT2J6LwXgwKr65CQtYiOBoqI5ivh8hVZm98+PpFRlxNQyIlK93g34o1JiNLrOM1tZQs0g543i+8sQqFD+KRu8MVGTazkcmdhX1uJiiOtkd+tQBZRGjdcX/4B86Bm8108B11IfDkICjIACEruBAmmCE82RIRSQsRGmWGxV564M2ZBM+5KvDmKsN99ngs1Bqzj2yqE0b/3sqUCQg18Vi3x6N3+5kQZLQGIaHSDcGbLODkqgsL7gTYmKnCyUUXHt4z4WI5FbbT5WGhMRp2U+VgP0MetjpysNIaA5spY8CboQBHLQXY68jDXU8JS8xUEGqtDsF8VZhPHwPzqbKw5IwrIUJqBJbQ37ky/6qtPXaUTzA3wMuZUx+y2AjBfobwdNCGNw0UYamJKGcdRDpqI8xaFaEL1SC00kAUTwupPjOxNVAfKQIOwpymY5ndFMI0rLCfAu8FqvDgqsKVlHLSV8ICbXkYKg+D/kQZCCw0sZw3O58IKUtXJjVvXyzGmJ/VbHUVv/WYMxF8ownwmDMBwZbqiHLTQThPGyHWGhCYq8HHVB1BVppYYquBAAt1CYFFs5XhoEeqzlKE6dRRmKc+CnPURsFQRQazJ8nAWGUkzLXHIMRWF/vWOqJbtA1dX0VhU5DFQTU5OXlpjL3FjMWYhJiLsbLYmUg5GYyH40dKsJw5lgZkkIOltgIsdBRo5nKYP0UexpPlwFEajlmKH0JfSQaGk2XBM1DFSseZyKRYy/HjIDfECBXJTmjbF4jehng8O78eP13YjB5xLjr3BeHwBv6Pc7TGD1a3b7mT/cD2kolTJsoucuOq3XUgUuZTR8NEczSMVWXBVR8BY7URmE9KmE+TA+8jRXyyUBmbA/Tx1UZrnKtJxJO7R/DqYSVedoVjoMwRt0p98FS0Fi8upeP5uTR0U469eDAYJzM9UL/NmfKmH4qinb4nwyzO2OIbMgOwvDUjK9y6vb10Cao/d8XeeFsJKjc4oSHXExfKg3GrOgR3v6TabK8t+svs8UrsA/Ruw+vL4ejeb4rOHZa4dlhIiTwJD6hKuXAgEE07+KjLcCa4oHmnFzr2+qAxxwvpwRZNZHOylNg744y5U95EZ5Lp/jj7lx17yHC1EM9ak/HzRZL/3Eb8THjWmYZnbevxuDUNj8Sp6DkWhK5ME3QXzsGF7XPRlueG76vCcKXqU7Tt9ZVUFGdyPXCWWpa8O/ZQ6tolQEOWF3LDba7bG00LYJ4isNPVOy8m40gtFXlO9nLru6d3+uNYmi0OJ9mglmYqLvTCd2UhVORRciejrL1WQwSqPyP3BOE47Vd1pDCrIJopWYvyqKIgZcRU4rTRRiza5YWGTC/UbOK/3PapTddiC87W999/bwHZ1CKw0ofl7CGJMT+rWutphJ4tTfn17okN6CxZQtJ742yeO0T57mgu4OMsgbWiAqokiIB4N+VWItC+T4B2qv1b8okIuak+k48T6a5vDibynm8MtGoPdTQsmqE6fgnZMCOwHZ9VF4wUO3sOWfszxdjBleUtTrjLvKKvs8N/bi6Jhbg0Cs3FwThNMdZCZET5XjiV6UYxwqfWAyepmqhJc3lTkej4qnil/XOKm5txfG59iI1+8TydydGyssOcaUxzAqsoZkoJjaOWlTzMhX94GJa4k8CC0WCS4mgvGwP11MVmuns/cdA7EuZkUBdmpy/6zEFPvG6pfb3Q/qMan4+19jsaaGRydSYlaijKBckOG7aI3jUlcAlzCXoEbYI6gcUSU4jZ+FOEqJ/kGjwtsT1tgnRAfakBE2rnS42yypPFBzu8GhNmE1g/psZ0giaBTY6dgsYSWC5kFcy/RWaQ1D+Tk5wvpQMqSklOolZVapDtO8wwU4BNgBFgrpGXvsMUYe+z0GBB/Yeu+lcSv/c8+IlA8r1CamTwowl7HsSgcTaZ/+qbxCCZvwPi66u3SEAqsQAAAABJRU5ErkJggg==",
	businessman: "data:image/png;base64,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",
	cat: "data:image/png;base64,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",
	cupcake: "data:image/png;base64,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",
	detective: "data:image/png;base64,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",
	dog: "data:image/png;base64,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",
	flower: "data:image/png;base64,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",
	horse: "data:image/png;base64,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",
	margarita: "data:image/png;base64,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",
	ninja2: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAcWSURBVFhHrZd7cNTVFcdNyIYkbEiyCZvNvl/57TO72Wd2NyEvkiXZRJKQIETzICRutULFmInG8YEBfIz4wnEUBMGmCsJA5dGCTLFOW8ZOMfKQDD4K/cM6VhHQqdWpqF/P+SkKymOX9jfznV+S37n3fM695557ctVVV/6k0VA/6VbSKtIu0h7SZtIDpGZS1pVPf/GR6fRpPumvmZmZZ/R6Pfx+P0KhEMrKylBSUgKFQoHU1FSQzQSp9/8J4abJ9kmlUkQiEQwMDGBwcBCLFi1CX18fenp60Nvbi66uLsRiMRgMhrMga2gcg/9PT5hGf8iTxuNxLFmyBENDQ+js7ER9fT2qq6tRVVUlqq6uDq2trZg7d64ImpWVxasxRkq9UoIiGnjMbrdjZGQEw8PDaG9vF5eel5zldDrP+9nlciEQCKChoUGEmjJlCkMMXSnAKq1WKy53f38/Kioq4HA4RIdut/uiYgi2mT59uggzadKkTwnAkCyENT1d8gUvJ+8xJxtHeynHP/3GELwtRqORV+G+ZAHu4Uzv6upGOBy+bNQXAmOA8vJyMVdoFd4mgIxEIShpUvaFqmKYObMx6cjPwvBWeL1eMTELCgq+JueBRAEUaZm5n4WiXTSBBzzRuRGWlpbirC63JWxXU1MDnU7H29CdKEAke1rxV77aa+F2/ZhwHo9H3ArBYkWxYIHN7hDhPB7vBYHY3kXJqtLokSfLZ4CRRAHmyDSlCEb7KPLvASgSeaECsrw82IsNKLGZodeqIZfLkZdfQE50BGQnQJfo1Elvtc4g2rfV+eG1iytwb6IAA9NMYZQ1xgmAI/Rgak4uAi4Bu54dxcSOh3Fg0yheG7sT65f149a+JrTUR2DUqqAolFNJLoS8IB+Vbi1W3tKMQ2OL0V4pMMCShAEKjEGEmheKy6vXGyDoVZjY/TTe3XEfXri7Bct6vLi/L4AtSzsw/tzNOLjpHhx9eRVe3fAgdq9fjl2rhvHqk/0Yu6MZS3sCCJpzkwJYIFO7EJq1GL5ASIx+5MZr8PmRLVg9FMP8mA+Pjg7hkbsW4qa2AFbcUI0/rFyA43ufwonXN+Lj8U04vudxPLGoGoN9LXh+3dOoj7iSAohJ8/UoaxmCP1SJHAJ46PZ+fPnWdoz+ogHts2fji/+eAT+n3j+GG2f5sGlZJ9778zq8/9rz+GB8K04c2orl19diy8Yx0S46ozqpHPClZ+acCVw9hGBlE6TZ2RiOd+A/Ey/h7b1rcV1LDfxeNxbQTdjb043upgAmdj6GD/a/iA8P7sBHh3+P00f34PCu1eidE8PA/OtgM2sY4KlEcyAvJSX1hLNmAKH6a6FUFsHjMOGff/k1Th76LU69uRPjv1uNbWuXY/dvVuAf+17Av/ZvpKi345OJnfjs6E6cJrtPj2zDR/s34L0/rUNXWy0DrE0UgK/PP6odtQg13SDWgskZmbhr4Tz8+8hWfHxgC04d3iY6++RNeh/ajJMHNuOdvWuw4bFh3BZvR3drDToayzG4oBUvr1+GtmiYAbg/SPi5Xyorgm9mHF5/EFarFdnSbNw8fxbe2L4Sx19Zi2OvrMHBHU/g2QcXY15TJXSqQqhUSpjMAhwlblFcHwrpaE7JymCAZxL2ToZVKSkp3xidFSgNVtJxpAkdTsio6BTK82EzaUXJ82WQEphcoaQmpByNjY1iVxSNRsWb8LsmpY0gChlgNBkAbj5fz83NhcnipJJbKhYklp16Ai7FYjm22cVyzPe+z+cT74xzGxX+xjAymYwBfpUMANt2SNLSvlIqlXSZGMCd0bkX0U8vpHMvLf7Gv/MYbs/oOmaA2mQAMsm4n/R5Tk4ONBoN1Go1jAY9TWoTJ78QDP+NV4FtNBo1/IEyCFYnO/87SZooQJQM3+C9ZcfcmLBzrcEKneCB1ihAR+W52GyGRSiGzSrQVlhhsQgwm4zQaTV0dFWwOT2IVFQjPX1yUjfhTZMzMr4MVETR3N6D8orpFKkbZnKmUhOMxQNzoBnFZbNhKKHMt/igK3ZBa7JDYxDo7YDe6oPVN4OqaBWys6Xs/G+kqYlEf02WdCrqZw+gtecWBIKh81oxk8kEZZECGr0ZZl8TbDXXw1bdD0t5J4TwHFjpbQl3wOiug1pvweR0CTsfJ5kScW6ZlCY5XRXrxqzuYZT6IyhxOn7WhJ6FUCkV0JkdEIKtsM/4JRy1cRh8rcidpoFEIi75CdIKkiwR52zzktHmR8O8xfCU1cBVcvEOWNwOlQoqKtEsrdEKs6sS+XItO36LFCcl1YbXTc3J+yZYOwee8AzK8Ev3/ZzpFotFTEwGUVP142QtLFIxwL5EI/7Bjirei8WCFd5A5Lwe8FINJ0PwPyl8QkQIguF6Qef9JE2ckwyEmaudRzy/53e/iXS8XA8EgbKf/oNiAIlEcoacC5cD+BYb2TBuQbdnsAAAAABJRU5ErkJggg==",
	note: "data:image/png;base64,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",
	pizza: "data:image/png;base64,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",
	'secret agent': "data:image/png;base64,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",
	soccer: "data:image/png;base64,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",
	'sun cloud': "data:image/png;base64,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",
	superhero: "data:image/png;base64,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",
	'volley ball': "data:image/png;base64,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",
	generic: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAfCAYAAACLSL/LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAVRSURBVFhHtZgNTJR1HMfphZIMT0BgIC9DmZACsnAtpuvKaejyJRFfFrUGmKa4igATKFdGXrOhUTqVwBZrE4jFLvJCOhFFkGNcdDLgQm6MuOy6wQ66g1134b/f98/znOiSl/Hw3/3uxt3z/+3z/P7f38uDm5t06yFyJZp0XmfoCQCPkD1G5uEdHr4gTr5pUZxczg3fCb/hGlw750sE8khIejMiI/9U9rGzF8q/UarblPXNPT83/nKrul5z61y56mq24mz+xl17lhHRPOEm5gwQjt1lshCv9COFn1Rd1vzV029mFpudjTqczOEc40YvZqc30+Aw+77munH3gfeTaN/8uYLjUP7+S/wOfviFsrnDwGyOMQ5kI8On/R44oqOF97oW3d+JaZmbaf8TZA9LfabQyoLEfXmf1jS2sUGrnVntBEXGoVzRQsTGGL0IahwOf5dU/NTuHRS0WNCdZEcKR/NClj+z/ERp1WBnr5Efn83ucEE5+RGKKJznntVnNLNX9h/eS348pYwawi/b8nrGW6oGLQPY8Oi4rsTjG0OIJllOp5MdLTxfSX78IAmpjhOO/NKyFUVNOj2B9XMwEWqySE1kLftR3SWT+S0RslQStsfJy+J9uQXKlo4e1mHoZxbrqEtXUwTLxVZ/Qze0YkXsSiFDJdEZ6lAwRew7gLX39DGzxSqUhgfr6v6Tbfq1ayQiKmoVkkiqoouIBb+anne6oa2TdRCY0TQwYzCNTm+PXb12PflaKBUY2k7g81uS361pJPHTURr6TFxj09UXotfWaXCu2bANxdZLqsx8lBz5BoRFri+pvGTVU1YCzkYJMF6vprf0ht8dApi3VGAoFwh/1HuKM9r27l46zn42QDqbCZhOb3CuTti+k/z4kKFgz3ohg9Drlr6c+k7h1dYOHjGjeZD3xelmpebmb/aYZ+UbyI9kEcOdcZ2FRcRsLqpQDQGsl6r5eNOeXmbW37g5Ero0Ml5KjQEMoYdoo1Mz8y+2dHSznn4TG6VeiXY0VeWHCqsuXfszICDkafIhkyorAYbjxHQQFv/itqwf6jV3uvtu837pitoUkTt5/kI77X+KDP1SkgIrihStyd8vMGzdubKLQ/o+I7OKPfN/p4u7GYuopmQcraH94YJeZy38iQ6QnV7u7u6xH58q7RKbOR99yOzUqO8Oi+PaAxDW4LCNBa5cW0j7Q8nQSSRdCD+OISL3eHGrvvc2NXMHRQ3jzxiBMQ6G2UyEBBzWt9V1/7h5+G6nvQFCIkkKBmcoG+EfnPxa20NZaSEoi83BoDdE0Gi28AbPtSeM2Dp9L9ualtWAxEHEySSpYfffGa9ndJRa48Awn2QxNGL2r77SzFQNrUzdpGVXWtpZZW0jy1KcsSQkp9eFRq7aLRwjEkhS4YuA8z09fSK+LFV2AwpmHh7lkdN2GliVupHVUj9945DiD3f/ZZ/TiJ9MG9eQ4WkJ0ZJsSJwYMa6xkMjouDJVwxBmfkRLBDRZbAxNHpHbmppxma5dRxZDFky2kAxTiuQPIwDkPVP+0q4d11s7/4XIIXxoDIBIBD1NHUoCO5B3vFaAwiiNh18MAnMCBTCIdlHKwZzDEDvEjVIBOECJ1krD5CHFaTVdi5r1pAA0J7oCFBzjKII+OlFcDRiUBjyQoIZxQMpEfGLqKC5XGTbt3Jvy3MakaDdfX8BhL6ImGSAc4QjQxH3ePlKg6KS5SnxeFAsqhkYOKRjKRXef6Y5ao7N+VV7TnKMoOrZjT2Yc+UBWzhrQ9X+K1/bnyAuKK65hpH7QQimdaOJ1+A6VX92oG8n9rKQo/oVEVH/c6KSa+w/KMOZFaoxzNwAAAABJRU5ErkJggg==",
	'generic aqua': "data:image/png;base64,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",
	'generic blue': "data:image/png;base64,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",
	'generic green': "data:image/png;base64,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",
	'generic orange': "data:image/png;base64,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",
	'generic purple': "data:image/png;base64,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",
	'generic red': "data:image/png;base64,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",
	'generic yellow': "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAfCAYAAACLSL/LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAY8SURBVFhHtZh5TJN3GMfZgYAoRzm0AkWwWuWoQKH0oJSrUzZRvHXGqFvEOHVTp26Jxrhsc/wjUTe36UzMRDMcaEQlCgMU2aYihR7QFgQ88OAYQgulqIvPnue1VXTzWHx5k+cP4P09+bzP8X2eH05O7D1voCuHsef1f3oigLfQhqG5cThOHiLRCF+H0e/sf6N36N0hfxxAblOm+AhWfzJ24xdb+Ud+2j2xNv9AWNOpwxFXjh4Iv/LtDkHFurVjv0pN952ARK72jxgyQHLs7Onp5L1iJe/rvP1h7Yaz8dCpmwqWpoXQf3UpWFsWQ1/DNOjRJ8C1P+Igb1/YzTkLAubgOfehgmOg3Ee5+6/4KLiwojAKuuqSwdKMIK1rwHpjNVivZ0H/jZVga13F2L3W5WBteAeK84SWGTPGZOD54Whvsp1TqhWPzHljsk8cioTb1XK4a5oJlqvLwdyQCd06GZi18WDRoemlYK1LhP7m2QxcnykdfsyZpOdw3ALsdcdaSsmRK48/Iix7+/iu2hIRdGjTwNy0+BGUVgIWO1RfXTz0D7Z6OQy0zIemSgXMnc/NQj8j2Ywahd9z2sxRHx8/GAEE1qlHsMY5CCVlItWHkXoKaDCcIRHrLgO2bRlfgH78qSTYSic58l+6LGjf2WOToaYkBjp0yWA2pINZJ2XS969IPRU5CdiuZEDe/hijp6dLqL1LWWFzQS8BH2bxCisLJ4P6TDS01yQhmIoBe2G07IC2xnSoPKHsCQ8fPtneoazUGelQ0JIPAvMJrPp0NNy8rAALgln08pdE61GKbdidl0pSrAKBWyw1EVuiSxELWvB+wJ7SAiGoEazldyn0IlhvneLVwIzJUFWSPCASeajQlxdbYDR2xiSm+q4/cSgCajCVhrI4MNenIRgW9rOd+B8/20wpoClNfZCg9COx9WarM99GR37cIBfVDzmCXk1xNNQWx0AXNoC1Tolgkud3pKPGTGlgrFDdT1ByCIzDFhjJBYU/Yv26EHV1URSTzttYZ9b6lFcAw65smAK6ctUDudx7HvrxQSPBfu2HOohm3biMzNG7Sn4VMuls+RPrzKiCPr3sJRFDMOzKqmLlgFDoMZXNiNGXMXUWEuKW8d0OQQ+Bmc6JsTOpzl7eAAR27pjcGhzsKmWzxgiMQk9FG7lkSWARyUZ9eRzcxTqz6FAyXqT8JBcIdjxXfMfX1zkGfXiy1ZUERumk7SBELPXeUHAg4qG+NJZpADOCMer/3AkgZcD25ETr8fwkNJqXrAiso0hpNI3i+Luk4SLYo0WwTk0iRk2OMzP+yXYxCJKRknoZ9BnfhdVrJp7B83x7vb524Q92QN3p7ezsFLV18zijplSMW4YS/qqVwV00B9zj9YdWINw8bMYknK3TgR/rtwvPB6PRJGH1ofBTGgQbN4RU68tk0KFRQidB1eN4wg2C0kqA3VoxRlCC0yEFBppnwtFcxT0nt2Gz8SzX3kisgpEzkg3+5s9C1YbzUmirTYC2GgUYKhSgLZPCtSoVrkTToNs4HfoacZFszETFV8Ks+YGV1DgUcTRWNOzZL2P0bNsWvrrlggxFVoJgcjCdV8CxnyOhMFcIp/OioPSoGAoOxsKmTYJuVQa3PDjUfYE9jdRArBa+A9B95MhhgpzsCY23q2Vwq0oMrZck0K5NggunRHBkfxicxHm6dFngLWcf1514aBFaAhrdliharC2JgyPG1BiPN1yUuze8p1MjhzuX4xi4O+pEuH5JCjTk8foG783iluG7aWhCtCA0LzTaUli/jBAgMzNxEM8tzxf+TReQDjVCXRZDW7UEOzQJSELyESwri1dih6JVmi6/tAgMCRSBUdH6Ll7E/Vz3Wwx2IN4pa1AyEK5NHQ/tGgXKQipcOCkCvOyW4rukWSPsQENSVwRFjikVgdiRJwmG9KpLI4YuhGMAayU4CZIwrSmwd+ek5vR0v2WJiV7UiQRHZylqrAGSI0oBDXGfVSt532iK4+7bTKmMRtHOT4DdBEiG2kWToBMhMaoPi36J7P1+h+DihrVjt2fO5YrQB3XlawM+/j/FwoWjldlf8s83VYig36BgZp/NmILrzpMlkcbPYHNc5+h3ty7GQdHhCOvGT0P3SaVepP70oS+suX8AhYSBZwZhkU0AAAAASUVORK5CYII=",
	guest: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAcCAYAAAAEN20fAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAU2SURBVEhL7ZZ5TJt1GMfrVVqOlrNQCoxxlTuDSAzqJroM2MQIgZgImcqQsUVRZrYh4jJCHQPGkQ2HC5thCEyuCpSjUO4WylEoR9eOGzZQmAQQcSiKef099YV0BWwJbH/5Jt+07/s7ns/7XL+XQNj59Qxa8gKSDpIRgUw2Q7+mSIb4MxiDOU/sgs2fB2NEHUNbHVPmW1oG+4PNmW4R+nS7MBLN6l1NOtOHQCLtQ3O0kZ57UiTwpvpadPsjYLye38Genlsa//X3NQw0PbswXFxem0c1ZX6gTbc9iOZScfA95QFvUCh0J++IT6PjZheWp9cBlH/vz8wP+gUdP6dlzPTCPbOnYSJqaFBs3D2PfDS3uDK3HcSGd5CnTK2cQwkEkjmeT3vmFR3ICW6TsEQVxPr4ze8KsrSMrV9HBJo7pQAXPou/ARnfgITHmQaJiUIyoy7I0Ph0j7aJTRBab4DvAXsBFOwN+Qa2NoUNHmgg6SJBOdoi2SNZI9GR7Kh025O/PPrzb3VBII809S3fR2v343vY4HvC3mADbIHNDRj4A7QmSK6sxOQIbn1LJr9DXPADh5sS+mHEO+i5F1Gf8cnib6t/qAsyM780RdY1P43WvvpmQEBAVs6dK8WVvIKcwtLM87Fx8NwVyRi3LYcBN9GMjIxeFnT2fi8bfYApSjpyfyU7tyCNSDH5cmzqoVRdELF0WECi0s9fTrv2VZ1QtFwv7MYUxeY2cCwsLF4B2ziDvEM6NQtFucoQ6/d3hyexU1Ex11O+zspVF+Rk5Nnrx8M/Tqxr7XoMQBGmsJybh2w7IAEDgebh6emD3nxtOxA0hnUPDN7VoBqzpMOTXapgWtrFXOTBC5w6fqeyJ5Tu17z9/PwRgxGAmKVn3IjaDkLRK3RL20hnj0PRow9m+7aDGbg3IWDYuJwh6ei+V9cmWlMBgsUnpZ5DDAy1QcArNkxmIJlK9yfrmZ+KvpBwo1c22jE1Mz8CahdL+KejYq5q6FuEaVCMfPX09I6qgoBxVnLa53gVEWiHvb39/is04JU+2agMLThG1KW9DdVgZe92KTD4xM3EtMyimIuX7wSFhGbpm9pc1DS0CEeH4jE016e6pV2iCgYPDSQsgYLkLOzuL9kqPOAJydA4FhufdJWkZ3o2KjoudXB8WrRVT1lcXl3pl423BoaEs8hURtSZL+KSeChZUYi2TNgiDvc2FMp6shKhh5hZWr7W1SutUSpdTDI4tpaccauYYeWUAiWpKlFhHCBrG4UVOgZmCbGsK9k8QeeqsmcqGvg8a2v5wQi9BBjk3w1QPnZIR+PiE1iolCvFkqGecm5dsY9fYPo+O5dr0w8XxtSBUJxzb2yqW9uAkXrwsO+lW/mFBVVNrT2FnJrKz6JjE8AWbhMiIv92ga4KVG7u7h7BGd9kpfCahaW1TYKyEk4NO+REZD7yUv9OIdbnNwl7Gv2Dw3LQIVicW1RWlscuL41PSkt3OXAgGNl0R4IjBBjkne1Fdnl1KnTR9dBIhiaw6qZ2TCiWyj98diM2txkrqKjDHmtubaLV/NLK2wrdleDQJxtrU07UXukIxuG1Yj8vPtoVBLzA8OQM9m0hB6vhd2xK2hrU/WhmZi7gkZeUIaClCzr7sUaheNcQALK08heWw67CKhpat6wgR1fXNwDkkDLIv2HpwHqlY3sCAjDclo7N4cEPQqaTkw+AeG0GGUf0Qmxw4sc9A+GLBpBXqjHoK8qlbOfo6Ls9SH0biu1PewgiwbJLqv4H2fAoX6TaI55b5shTDI2Di8vhfwBPo/BH7TydRAAAAABJRU5ErkJggg=="
};