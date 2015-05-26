(function() {
	// We need a promise library to help us. 
	// We'll be using P for this example (https://github.com/rkatic/p)
	PromiseFSM.setPromiseAdapter(P);

	// Let's use a door as an example. It can be open, closed or locked.
	var name = "doorMachine";
	var options = {
		// Let's log some messages
		verbose: true,
		// The list of states
		states: ["opened", "closed", "locked"],
		// Initial state is "closed"
		initialState: "closed",
		// Corresponding methods will be created on the machine interface
		actions: {
			open   : { from: "closed", to: "opened" },
			close  : { from: "opened", to: "closed" },
			lock   : { from: "closed", to: "locked" },
			unlock : { from: "locked", to: "closed" }
		}
	};

	// Create the machine and retrive it's interface.
	// Other actors can use PromiseFSM.getMachine("exampleMachine") to retrieve it.
	var machine = PromiseFSM.create(name, options);
	// Add an event listener to passively listen for state changes.
	// An event object with type, from and to properties will be passed to the callback function.
	machine.$addEventListener(PromiseFSM.EVENTS.STATE_CHANGED, update);

	// Some shortcuts... 
	var openButton = document.getElementById("openButton");
	var closeButton = document.getElementById("closeButton");
	var lockButton = document.getElementById("lockButton");
	var unlockButton = document.getElementById("unlockButton");

	// Run update() once to make UI reflect initial state
	update();

	function update() {
		// Updates UI to reflect the current state

		var currentState = machine.$getState();
		document.getElementById("doorState").innerHTML = currentState;

		switch(currentState) {
			case "closed":
				closeButton.setAttribute("disabled", "disabled");
				unlockButton.setAttribute("disabled", "disabled");
				openButton.removeAttribute("disabled");
				lockButton.removeAttribute("disabled");
				break;
			case "opened":
				openButton.setAttribute("disabled", "disabled");
				lockButton.setAttribute("disabled", "disabled");
				unlockButton.setAttribute("disabled", "disabled");
				closeButton.removeAttribute("disabled");
				break;
			case "locked":
				openButton.setAttribute("disabled", "disabled");
				closeButton.setAttribute("disabled", "disabled");
				lockButton.setAttribute("disabled", "disabled");
				unlockButton.removeAttribute("disabled");
				break;
		}
	}

	// Bind clicks to machine actions
	openButton.onclick = machine.open;
	closeButton.onclick = machine.close;
	lockButton.onclick = machine.lock;
	unlockButton.onclick = machine.unlock;

})();