(function() {
	// Simple mock asynchronous service
	function AsyncService(el) {
		this.el = el;
		this.reset();
	}

	AsyncService.prototype.reset = function() {
		this.el.innerHTML = "idle";
	};

	AsyncService.prototype.load = function() {
		var el = this.el;
		el.innerHTML = "loading some stuff...";
		
		var deferred = P.defer();
		setTimeout(function() {
			el.innerHTML = "loading completed!";
			deferred.resolve();
		}, 500 + Math.random() * 2000);
		return deferred.promise;
	};

	// We need a promise library to help us. 
	// We'll be using P for this example (https://github.com/rkatic/p)
	PromiseFSM.setPromiseAdapter(P);

	var runButton = document.getElementById("runButton");
	var resetButton = document.getElementById("resetButton");

	var name = "asyncMachine";
	var options = {
		// Let's log some messages
		verbose: true,
		// The list of states
		states: ["initial", "loading", "completed"],
		// Initial state
		initialState: "initial",
		// Corresponding methods will be created on the machine interface
		actions: {
			toLoadingState   : { from: "initial",   to: "loading"   },
			toCompletedState : { from: "loading",   to: "completed" },
			reset   		 : { from: "completed", to: "initial"   }
		}
	};

	// Create the machine and retrive it's interface.
	// Other actors can use PromiseFSM.getMachine("exampleMachine") to retrieve it.
	var machine = PromiseFSM.create(name, options);
	// Add an event listener to passively listen for state changes.
	// An event object with type, from and to properties will be passed to the callback function.
	machine.$addEventListener(PromiseFSM.EVENTS.STATE_CHANGED, onStateChange);
	function onStateChange(evt) {
		if(evt.from === "completed" && evt.to === "initial") {
			service1.reset();
			service2.reset();
			service3.reset();
		}
		updateUI();
	}

	// Our asynchronous service
	var service1 = new AsyncService(document.getElementById("service1Status"));
	var service2 = new AsyncService(document.getElementById("service2Status"));
	var service3 = new AsyncService(document.getElementById("service3Status"));
	
	// Updates the UI to reflect the current state
	function updateUI() {
		var currentState = machine.$getState();
		document.getElementById("asyncState").innerHTML = currentState;

		switch(currentState) {
			case "initial":
				runButton.removeAttribute("disabled");
				resetButton.setAttribute("disabled", "disabled");
				break;
			case "loading":
				runButton.setAttribute("disabled", "disabled");
				resetButton.setAttribute("disabled", "disabled");
				break;
			case "completed":
				runButton.setAttribute("disabled", "disabled");
				resetButton.removeAttribute("disabled");
				break;
		}
	}

	// Run once to setup UI for initial state
	updateUI();

	runButton.onclick = function() {
		machine.toLoadingState()
		.then(function() {
			return P.all([
				service1.load(),
				service2.load(),
				service3.load()
			]);
		})
		.then(machine.toCompletedState);
	};

	resetButton.onclick = machine.reset;

})();