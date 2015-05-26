var app = angular.module("PromiseFSMTestModule", ["PromiseFSMModule"]);
app.run();
app.controller("applicationController", [function() {}]);
app.controller("doorController", ["$scope", "PromiseFSM", function($scope, FSM) {
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

	var stateMachine = FSM.create(name, options);
	$scope.state = stateMachine.$getState();

	stateMachine.$addEventListener(FSM.EVENTS.STATE_CHANGED, function(evt) {
		$scope.state = stateMachine.$getState();
	});

	$scope.open = function() {
		stateMachine.open();
	}

	$scope.close = function() {
		stateMachine.close();
	}

	$scope.lock = function() {
		stateMachine.lock();
	}

	$scope.unlock = function() {
		stateMachine.unlock();
	}

}]);

app.controller("asyncController", ["$scope", "PromiseFSM", function($scope, FSM) {
	var options = {
		verbose: true,
		initialState: "before",
		states: ["before", "after"],
		actions: {
			run   : {from: "before", to: "after"},
			reset : {from: "after", to: "before"}
		}
	};

	var stateMachine = FSM.create("asyncMachine", options);
	$scope.state = stateMachine.$getState();

	stateMachine.$addEventListener(FSM.EVENTS.STATE_CHANGED, function(evt) {
		if(!$scope.$$phase) {
			$scope.$apply(function() {
				$scope.state = stateMachine.$getState();
			});
		} else {
			$scope.state = stateMachine.$getState();
		}
	});

	$scope.run = function() {
		stateMachine.run();
	}

	$scope.reset = function() {
		stateMachine.reset();
	}

}]);

app.directive("fsmExampleActor", ["PromiseFSM", "$timeout", function(FSM, $timeout) {

	return {
		scope: true,
		link: function(scope) {

			var stateMachine = FSM.getMachine("asyncMachine");

			scope.$watch("state", function(newVal) {
				if(newVal === "before") {
					scope.status = "I'm idle";
				}
			});

			stateMachine.$addTransition("before", "after", function(done) {
				scope.status = "I'm doing stuff...";

				$timeout(function() {
					scope.status = "I'm done!";
					done();
				}, 1000 + (Math.random() * 2000));
			});

		}
	}

}]);
