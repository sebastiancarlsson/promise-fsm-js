var PromiseFSM = (function() {
	"use strict";

	function StateMachine(name, options) {
		Object.defineProperty(this, 'name', {
			value: name,
			writable: false,
			enumerable: true
		});

		Object.defineProperty(this, 'locked', {
			value: false,
			writable: true
		});

		Object.defineProperty(this, 'verbose', {
			value: options.verbose || false,
			writable: false
		});

		Object.defineProperty(this, 'transitions', {
			value: [],
			writable: false
		});

		Object.defineProperty(this, 'listeners', {
			value: [],
			writable: false
		});

		if(this.verbose === true) {
			log("Initializing state machine \"" + this.name + "\"");
		}

		if(!promiseAdapter) {
			throw new Error("PromiseFSM - No promise adapter. Promise adapter must be set through PromiseFSM.setPromiseAdapter() before initialization");
		}

		if(options.states && Object.prototype.toString.call(options.states) === '[object Array]' && options.states.length > 1) {
			Object.defineProperty(this, 'states', {
				value: options.states,
				writable: false
			});
		} else {
			throw new Error("PromiseFSM - You have to define at least two states. E.g. options.states = [\"state1\", \"state2\"]");
		}

		if(options.actions && Object.prototype.toString.call(options.actions) === '[object Object]' && Object.keys(options.actions).length > 0) {
			Object.defineProperty(this, 'actions', {
				value: options.actions,
				writable: false
			});

			for(var key in this.actions) {
				this[key] = this.__transition.bind(this, this.actions[key].from, this.actions[key].to);
			}
		} else {
			throw new Error("PromiseFSM - You have to define at least one action. E.g. options.actions = { myAction: { from: \"state1\", to: \"state2\" } }");
		}
		
		Object.defineProperty(this, 'state', {
			value: options.initialState || this.states[0],
			writable: true
		});
	}

	Object.defineProperty(StateMachine.prototype, '__transition', {
		value: function(from, to) {
			var deferred = promiseAdapter.defer();
			if(this.locked) {
				if(this.verbose) {
					warn("State change failed - machine is locked");
				}

				deferred.reject(new Error(errorNames.LOCKED));
				return deferred.promise;
			}
			
			var transitionLegal = false;
			if((Object.prototype.toString.call(from) === '[object Array]' && from.indexOf(this.state) > -1) || (from === this.state)) {
				transitionLegal = true;
			}
			
			if(!transitionLegal) {
				if(this.verbose) {
					warn("State change failed - illegal transition attempt from \"" + this.state + "\" to \"" + to + "\"");
				}
				
				deferred.reject(new Error(errorNames.ILLEGAL_TRANSITION));
				return deferred.promise;
			}
			
			this.locked = true;
			this.__dispatchEvent(new StateMachineEvent(eventNames.LOCKED, this.state, to));

			// TODO add guards here
			this.__dispatchEvent(new StateMachineEvent(eventNames.EXIT_STATE, this.state, to));

			if(this.verbose) {
				log("\"" + this.state + "\" -> \"" + to + "\"");
			}

			var callbacks = [];
			var i = this.transitions.length;
			while(i--) {
				if(this.transitions[i].from === this.state && this.transitions[i].to === to) {
					callbacks.push(this.transitions[i].callback);
				}
			}

			var args = Array.prototype.slice.call(arguments).splice(2);

			if(callbacks.length > 0) {
				if(this.verbose) {
					log("Pending state change from \"" + this.state + "\" -> \"" + to + "\"...");
				}

				var subPromises = [];
				var subDeferred, callbackArguments;
				i = callbacks.length;
				while(i--) {
					subDeferred = promiseAdapter.defer();
					subPromises.push(subDeferred.promise);
					
					callbackArguments = args.slice();
					callbackArguments.unshift(subDeferred.resolve);
					callbacks[i].apply(null, callbackArguments);
				}
				var promise = promiseAdapter.all(subPromises);
				promise.then(this.__completeSwitch.bind(this, to));
				return promise;
			} else {
				this.__completeSwitch(to);
				deferred.resolve();
				return deferred.promise;
			}
		}
	});
	
	Object.defineProperty(StateMachine.prototype, '__completeSwitch', {
	//StateMachine.prototype.completeSwitch = function(to) {
		value: function(to) {
			var from = this.state;
			this.state = to;
			this.__dispatchEvent(new StateMachineEvent(eventNames.ENTER_STATE, from, to));

			this.locked = false;
			this.__dispatchEvent(new StateMachineEvent(eventNames.UNLOCKED, from, to));

			this.__dispatchEvent(new StateMachineEvent(eventNames.STATE_CHANGED, from, to));

			if(this.verbose) {
				log("Transition completed. New state is \"" + to + "\".");
			}
		}
	});

	Object.defineProperty(StateMachine.prototype, '__getTransitionIndex', {
		value: function(from, to, callback) {
			var i = this.transitions.length;
			while(i--) {
				if(this.transitions[i].from === from && this.transitions[i].to === to && this.transitions[i].callback === callback) {
					return i;
				}
			}
			return -1;
		}
	});

	Object.defineProperty(StateMachine.prototype, '__dispatchEvent', {
		value: function(evt) {
			var i = this.listeners.length;
			while(i--) {
				if(this.listeners[i].type === evt.type) {
					this.listeners[i].callback(evt);
				}
			}
		}
	});

	StateMachine.prototype.$getState = function() {
		return this.state;
	};

	StateMachine.prototype.$addTransition = function(from, to, callback) {
		if(this.__getTransitionIndex(from, to, callback) > -1) {
			warn("Duplicate transition added, only the first will be called");
		} else {
			this.transitions.push({
				from: from,
				to: to,
				callback: callback
			});
		}
	};

	StateMachine.prototype.$removeTransition = function(from, to, callback) {
		var i = this.__getTransitionIndex(from, to, callback);
		if(i > -1) {
			this.transitions.splice(i, 1);
		}
	};

	StateMachine.prototype.$addEventListener = function(type, callback) {
		this.listeners.push({
			type: type,
			callback: callback
		});
	};

	StateMachine.prototype.$removeEventListener = function(type, callback) {
		var i = this.listeners.length;
		while(i--) {
			if(this.listeners[i].type === type && this.listeners[i].callback === callback) {
				this.listeners.splice(i, 1);
			}
		}
	};

	function log(text) {
		if(console) {
			console.log("%cPromiseFSM", "color: #00f", text);
		}
	}

	function warn(text) {
		if(console) {
			console.warn("%cPromiseFSM", "color: #00f", text);
		}
	}

	var eventNames = {
		LOCKED: "PromiseFSM/events/locked",
		EXIT_STATE: "PromiseFSM/events/exitState",
		ENTER_STATE: "PromiseFSM/events/enterState",
		UNLOCKED: "PromiseFSM/events/unlocked",
		STATE_CHANGED: "PromiseFSM/events/stateChanged"
	};

	var errorNames = {
		ILLEGAL_TRANSITION: "ILLEGAL_TRANSITION",
		LOCKED: "LOCKED"
	};
	
	function StateMachineEvent(type, from, to) {
		this.type = type;
		this.from = from;
		this.to = to;
	}

	var promiseAdapter;
  var machines = {};

	return {
		EVENTS: eventNames,
		ERRORS: errorNames,
		setPromiseAdapter: function(adapter) {
			promiseAdapter = adapter;
		},
		create: function(name, options) {
			machines[name] = new StateMachine(name, options);
			return machines[name];
		},
		getMachine: function(name) {
			var machine = machines[name];
			if(machine) {
				return machine;
			} else {
				return undefined;
			}
		}
	};

}());