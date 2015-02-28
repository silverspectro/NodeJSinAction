var acf, _;
var isResize = false;
var cache = [];
var event_manager = {};

(function() {

	acf = _ = function(selector) {
		return new Acf(selector);
	};
	var Acf = function(selector) {
		if (selector == window || selector == document || selector.nodeType) {
			this[0] = selector;
			this.length = 1;
			return this;
		}

		var sel = document.querySelectorAll(selector);
		for (var i = 0; i < sel.length; i++) {
	           this[i] = sel[i];
	    }

        this.length = sel.length;
		return this;
	};

	acf.fn = Acf.prototype = {
		hide: function(callback) {
			for (var i = 0; i < this.length; i++) {
                this[i].style.display = 'none';
            }
            if (callback) callback();
            return this;
		},
		show: function(callback) {
			for (var i = 0; i < this.length; i++) {
                this[i].style.display = 'block';
            }
            if (callback) callback();
            return this;
		},
        remove: function(callback) {
            for (var i = 0; i < this.length; i++) {
                this[i].parentNode.removeChild(this[i]);
            }
            if (callback) callback();
            return this;
        }
	};

})();

acf.fn.addClass = function(value, callback) {
	for (var i = 0; i < this.length; i++) {
		var listClass = this[i].className;
		if(this[i].className) {
			if (listClass.indexOf(value) == -1) this[i].className = listClass + " " + value;
		} else if (!this[i].className) {
			if (listClass.indexOf(value) == -1) this[i].className = listClass + "" + value;
		}
    }
    if (callback) callback();
    return this;
};

acf.fn.removeClass = function(value, callback) {
	for (var i = 0; i < this.length; i++) {
		var listClass = " " + this[i].className + " ";
		this[i].className = listClass.replace(" "+value+" ", "").replace(/^\s+|\s+$/g, "");
    }
    if (callback) callback();
    return this;
};

acf.fn.hasClass = function(className, callback) {
	for (var i = 0; i < this.length; i++) {
		return this[i].className.indexOf(className) != -1;
	}
    if (callback) callback();
};

acf.storeEvent = function(element,evt,callback) {
	if(element.id) {
		if(!event_manager[element.id])event_manager[element.id] = {};
		event_manager[element.id][evt] = callback;
	}
};

acf.deleteEvent = function(element,evt) {
	if(event_manager[element.id]) {
		// console.log(element, event_manager[element.id][evt]);
		element.removeEventListener(evt, event_manager[element.id][evt]);
		delete event_manager[element.id][evt];
	}
}

acf.fn.on = function(evt, callback) {
	var isSlide = evt == 'slide',
		detecttouch = !!('ontouchstart' in window) || !!('ontouchstart' in document.documentElement) || !!window.ontouchstart || !!window.onmsgesturechange || (window.DocumentTouch && window.document instanceof window.DocumentTouch);
		/* detecttouch = !!('ontouchstart' in window) || !!('ontouchstart' in document.documentElement) || !!window.ontouchstart || !!window.Touch || !!window.onmsgesturechange || (window.DocumentTouch && window.document instanceof window.DocumentTouch); */
	for (var i = 0; i < this.length; i++) {
		if (isSlide) {
			var o = {},
				evtStarted = false,
				evtStart = function(e) {
					var evt = e.changedTouches ? e.changedTouches[0] : e;
					evtStarted = true;
					o = {
						start : {
							left : evt.pageX,
							top : evt.pageY
						}
					};
				},
				evtEnd = function(e) {
					if (!evtStarted) return;
					var evt = e.changedTouches ? e.changedTouches[0] : e;
					o.end = {
						left : evt.pageX,
						top : evt.pageY
					};
					o.dx = o.end.left - o.start.left;
					o.dy = o.end.top - o.start.top;
					o.angle = Math.atan2(o.dy, o.dx);
					o.angle *= 180/Math.PI;
					o.inMotion = (e.type == 'touchmove' || e.type == 'mousemove');
					o.direction = Math.abs(o.dx) > Math.abs(o.dy) ? (''+o.dx).indexOf('-') != -1 ? 'left' : 'right' : (''+o.dy).indexOf('-') != -1 ? 'top' : 'bottom',
					callback.apply(this, [e, o]);
					if (o.inMotion == false) evtStarted = false;
				};
			if (detecttouch) {
				this[i].addEventListener('touchstart', evtStart, false);
				this[i].addEventListener('touchmove', evtEnd, false);
				this[i].addEventListener('touchend', evtEnd, false);
			} else {
				this[i].addEventListener('mousedown', evtStart, false);
				this[i].addEventListener('mousemove', evtEnd, false);
				this[i].addEventListener('mouseup', evtEnd, false);
			}
		} else {
			var fn = function(e) {
				callback.apply(this, [e]);
			};
			this[i].addEventListener(evt, fn);
		}
		_.storeEvent(this[i],evt,fn);
    }
	return this;
};

acf.fn.preload = function(list, callback) {
	var imageLoaded = 0, listLength = list.length, callback = "undefined" != typeof callback ? callback : function() {};
	if (listLength == 0) {
		callback();
	} else {
		for (var i = 0; i < listLength; i++) {
			var image = new Image(),
				pipe = function() {
					imageLoaded++;
					if (imageLoaded == listLength) {
						for (var i = 0; i < this.length; i++) {
							_(this[i]).hide();
					    }
						callback();
					}
				};
			image.onload = pipe;
			image.onerror = pipe;
			image.src = list[i];
		}
	}
	return this;
};

acf.fn.scale = function(params, callback) {
	var _body = document.body;
	var coef = 1;
	h = window.innerHeight;
	w = window.innerWidth;

	function setCoef(params){
		var params = !params ? {} : params;
		params.pos = !params.pos ? undefined : params.pos;

		if ( _("#body").hasClass('landscapeMode') ) {
			// PAYSAGE
			coef = !params.coef ? window.innerHeight/768 : params.coef;
			if(params.absolute)coef = h/960;
			if(params.width === undefined && params.height === undefined && params.x === undefined && params.y === undefined) {
				if ( h < (768 * coef) ) {
					params.width = w / coef;
					params.height = 768;

				} else if (params.fit == "portrait") {
				  	params.width = coef >= 1 ? (768/(w/h))/coef : (h/(w/h))/coef;
					params.height = 768;

				} else {
				  	params.width = 1024;
					params.height = 768;
				}
			} else {
				if(params.width instanceof Array && params.height instanceof Array && params.width.length >= 0 && params.height.length >= 0) {
					params.width = params.width === undefined ? undefined : params.width[0];
					params.height = params.height === undefined ? undefined : params.height[0];
				} else {
					params.width = params.width === undefined ? undefined : params.width;
					params.height = params.height === undefined ? undefined : params.height;
				}
			}
			if(params.x instanceof Array || params.y instanceof Array) {
					if(params.x)params.x = params.x.length == 1 ? params.x[1] : params.x[0];
					if(params.y)params.y = params.y.length == 1 ? params.y[1] : params.y[0];
				} else {
					params.x = params.x === undefined ? undefined : params.x;
					params.y = params.y === undefined ? undefined : params.y;
				}
			params.coef = coef;

		} else {
			// PORTRAIT
			coef = !params.coef ? (window.innerHeight/960) : params.coef;
			if(params.absolute && coef > h/960)coef = h/960;
			if(params.width === undefined && params.height === undefined && params.x === undefined && params.y === undefined) {
				if ( h < (960 * coef) && params.fit == 'portrait' ) {
					params.width = coef > 1 ? 640 : w/coef;
					params.height = h/coef;
				} else if ( h < (960 * coef) && params.fit == undefined) {
					params.width = 640;
					params.height = h / coef;
				} else if (params.fit == "paysage" && params.fit != undefined && h >= 1024) {
					params.width = 640;
					params.height = (h / coef)*coef;
				} else if (params.fit == "paysage" && params.fit != undefined) {
					params.width = 640;
					params.height = 960 * coef;
				} else {
				  params.width = 640;
					params.height = 960;
				}
			} else {
				if(params.width instanceof Array || params.height instanceof Array ) {
					params.width = params.width.length > 0 ? params.width[0] : params.width[1];
					params.height = params.height.length > 0 ? params.height[0] : params.height[1];
				} else {
					params.width = params.width === undefined ? undefined : params.width;
					params.height = params.height === undefined ? undefined : params.height;
				}
			}
				if(params.x instanceof Array || params.y instanceof Array) {
					if(params.x)params.x = params.x.length == 1 ? params.x[0] : params.x[1];
					if(params.y)params.y = params.y.length == 1 ? params.y[0] : params.y[1];
				} else {
					params.x = params.x === undefined ? undefined : params.x;
					params.y = params.y === undefined ? undefined : params.y;
				}
			params.coef = coef;
		}
		return params;
	};

	for (var i = 0; i <= this.length; i++) {
		var params = setCoef(params);
		var that = this[i];
		if(that) {
			if (params.pos && (params.width && params.height)) {
				that.style.width = parseInt(params.width*params.coef)+'px';
				that.style.height = parseInt(params.height*params.coef)+'px';
				that.style[params.pos[0]] = w/h < 0.66 ? params.x*params.coef+'px' : parseInt((h*params.x)/1000)+'px';
				that.style[params.pos[1]] = parseInt((params.y*window.innerHeight)/1000)+'px';
				_body.style.fontSize = parseFloat(62.5*params.coef)+'%';

			} else if (params.pos) {
				if(params.pos.length > 0) {
					that.style[params.pos[0]] = parseInt(params.x*params.coef)+'px';
					that.style[params.pos[1]] = parseInt((params.y*h)/1000)+'px';
					_body.style.fontSize = parseFloat(62.5*params.coef)+'%';
				} else {
					that.style[params.pos[0]] = parseInt((params.x*h)/1000)+'px';
					_body.style.fontSize = parseFloat(62.5*params.coef)+'%';
				}
			} else {
				if(that === _body) {
					that.style.width = window.innerWidth+'px';
					that.style.height = window.innerHeight+'px';
				} else {
					that.style.width = parseInt(params.width*params.coef)+'px';
					that.style.height = parseInt(params.height*params.coef)+'px';
				}
				_body.style.fontSize = parseFloat(62.5*params.coef)+'%';
			}
		}
	}

	if (callback) callback();
	return this;
};

acf.fn.center = function(axe, callback) {
	var axe = axe.toLowerCase();
	var th,tw,t;

	for (var i = 0; i < this.length; i++) {
		var that = this[i];
		th = that.offsetHeight ? that.offsetHeight : window.innerHeight;
		tw = that.offsetWidth ? that.offsetWidth : window.innerWidth;
		t = that.parentNode === document.body ?  [h, w] : that.parentNode;
		if(cache.length <= 0)cache.push(t,th,tw);

		if(cache.length > 0) {
			if(cache[0] instanceof Array && t instanceof Array && t[1] == that.offsetHeight && t[0] == that.offsetWidth ) {
				th = cache[1];
				tw = cache[2];
				cache[0] = t;
			} else {
				cache[0] = t;
				cache[1] = th;
				cache[2] = tw;
			}
		}

		switch(axe) {
			case 'v':
				that.style.top = t instanceof Array ? (t[0] - th)/2+"px" : (t.offsetHeight - th)/2+"px" ;
				break;
			case 'h':
				that.style.left = t instanceof Array ? (t[1] - tw)/2+"px" : (t.offsetWidth - tw)/2+"px" ;
				break;
			case 'vh':
			case 'hv':
				that.style.top = t instanceof Array ? (t[0] - th)/2+"px" : (t.offsetHeight - th)/2+"px" ;
				that.style.left = t instanceof Array ? (t[1] - tw)/2+"px" : (t.offsetWidth - tw)/2+"px" ;
				break;
			default:
				break;
		}
	}
	if (callback) callback();
	return this;
};

acf.resize = function() {

	while (!isResize) {
		isResize = true;

			for(i = 0; i< arguments.length;i++) {
				var el = arguments[i];
				var fn = new Function(el);
				window.addEventListener('orientationchange', fn);
				window.addEventListener('resize', fn);
				window.addEventListener('load', fn);
			}

		}
		setTimeout( function() { isResize = false; } , 250);
	}

	acf.fn.getStyle = function(elem) {
		var fn = getComputedStyle(this[0], null).getPropertyValue(elem);
		return fn;
	}

acf.fn.doClick = function(url, actionName) {
	_.deleteEvent(this[0],"click");

	if(isClicked === false)var isClicked = false;

	function simclick(){
		var prev = window.location.href;
	    if(typeof url === 'undefined') {
	        url = "http://www.google.com";
	    } else {
	        url = url;
	    }

	  if(typeof actionName === 'undefined' || actionName === "")actionName = "CLICK";

		if(!isClicked && url != undefined && url != "") {
			var link = document.createElement('a');
			isClicked = true;
			try {
				_s4mq.push(['trackAction', { name: actionName, callback: function() {
					link.href = url;
					event = document.createEvent( 'HTMLEvents' );
					event.initEvent( 'click', true, true );
					link.dispatchEvent( event );
					// console.log(url,actionName)
					}
				}]);

			} catch (e) {
				link.href = url;
				event = document.createEvent( 'HTMLEvents' );
				event.initEvent( 'click', true, true );
				link.dispatchEvent( event );
			}
		}
		// console.log(url);
		// console.log(actionName);
	};

	_.storeEvent(this[0],"click",simclick);


	return this[0].addEventListener("click", event_manager[this[0].id]["click"]);

};


acf.delay = function(fn,time) {
	this.fn = Function(fn);
	return setTimeout(this.fn,time);
}

acf.timeline = function() {
	var that = this;
	this.fonc = function fonc(params) {
		var time = 0;
		var interval = params.interval || 1000;
		var step = params.step || {};
		var repeat = params.repeat ? params.repeat : undefined;
		var length = Object.getOwnPropertyNames(step).sort(function(a,b){return a-b});
		var max = length.length-1;
			if (!params) return;
			if (("string" == typeof params) && (params == "stop")) return clearInterval(timer);
			var timer = (function() { return window.setInterval(function() {
				if (time < length[max]) {
					time++;
					var checkIt = step[""+time];
					if (checkIt) checkIt();
				} else if(repeat) {
					time = 0;
					var checkIt = step[""+time];
					if (checkIt) checkIt();
				} else {
					return clearInterval(timer);
				}
			}, interval);
		})();
	};
	return this.fonc;
};

acf.detectOrientation = function () {
	var _body = _('body'),
		detect = function () {
			var orientation = window.innerHeight > window.innerWidth ? 0 : 90;

			if (orientation === 0) {
				_body.removeClass('landscapeMode');
			} else if (orientation === 90) {
				_body.addClass('landscapeMode');
			}

		};

	_(window).on('orientationchange', detect);
	_(window).on('resize', detect);

	detect();
};

_.detectOrientation();

acf.gyro = function() {
	var timer;
	if (!window.DeviceOrientationEvent && !window.DeviceMotionEvent) return 'not supported';
	return function(params) {
		if (!params && !params.callback) return;
		if (("string" == typeof params) && (params == "stop")) return clearInterval(timer);
		var interval = params.interval || 100,
			o = {};
		if (window.DeviceOrientationEvent) {
			o.gyro = {};
		    window.addEventListener("deviceorientation", function (e) {
		    	o.gyro.alpha = e.alpha;
		    	o.gyro.beta = e.beta;
		    	o.gyro.gamma = e.gamma;
		    }, true);
		}
		if (window.DeviceMotionEvent) {
			o.acc = {};
		    window.addEventListener('devicemotion', function (e) {
		    	var rotation = e.rotationRate;
		    	o.acc.x = Math.round(Math.abs(e.accelerationIncludingGravity.x * 1));
		    	o.acc.y = Math.round(Math.abs(e.accelerationIncludingGravity.y * 1));
		    	o.acc.z = Math.round(Math.abs(e.accelerationIncludingGravity.z * 1));
		    	o.acc.interval = Math.round(e.interval * 100)/100;
		    	if (rotation != null) {
		    		o.acc.rotation = {
		    			alpha : Math.round(rotation.alpha),
		    			beta : Math.round(rotation.beta),
		    			gamma : Math.round(rotation.gamma)
		    		};
		    	}
		    }, true);
		}
		timer = window.setInterval(function() {
			params.callback.apply(this, [o]);
		}, interval);
	};
};
