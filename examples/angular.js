var app = angular.module("PromiseFSMTestModule", ["PromiseFSMModule"]);
app.run();
app.controller("applicationController", [function() {}]);
app.controller("doorController", ["$scope", "PromiseFSM", function($scope, FSM) {
	var CONSTANTS = {
		"CLOSED": "closedState",
		"OPENED": "openedState",
		"LOCKED": "lockedState"
	};

	var StateMachineOptions = {
		verbose: true,
		initialState: CONSTANTS.CLOSED,
		states: [
			CONSTANTS.CLOSED,
			CONSTANTS.OPENED,
			CONSTANTS.LOCKED
		],
		map: [
			{from: CONSTANTS.CLOSED, to: [CONSTANTS.OPENED, CONSTANTS.LOCKED]},
			{from: CONSTANTS.OPENED, to: CONSTANTS.CLOSED},
			{from: CONSTANTS.LOCKED, to: CONSTANTS.CLOSED}
		]
	};

	$scope.CONSTANTS = CONSTANTS;

	var stateMachine = FSM.create("doorMachine", StateMachineOptions);
	$scope.state = stateMachine.getState();

	stateMachine.addEventListener(FSM.EVENTS.SET_STATE, function(evt) {
		$scope.state = stateMachine.getState();
	});

	$scope.open = function() {
		stateMachine.to(CONSTANTS.OPENED);
	}

	$scope.close = function() {
		stateMachine.to(CONSTANTS.CLOSED);
	}

	$scope.lock = function() {
		stateMachine.to(CONSTANTS.LOCKED);
	}

	$scope.unlock = function() {
		stateMachine.to(CONSTANTS.CLOSED);
	}

}]);

app.constant("asyncConstants", {
	"BEFORE": "beforeState",
	"AFTER": "afterState"
});

app.controller("asyncController", ["$scope", "PromiseFSM", "asyncConstants", function($scope, FSM, CONSTANTS) {
	var StateMachineOptions = {
		verbose: true,
		initialState: CONSTANTS.BEFORE,
		states: [
			CONSTANTS.BEFORE,
			CONSTANTS.AFTER
		],
		map: [
			{from: CONSTANTS.BEFORE, to: CONSTANTS.AFTER},
			{from: CONSTANTS.AFTER, to: CONSTANTS.BEFORE}
		]
	};

	var stateMachine = FSM.create("asyncMachine", StateMachineOptions);
	$scope.state = stateMachine.getState();

	stateMachine.addEventListener(FSM.EVENTS.SET_STATE, function(evt) {
		if(!$scope.$$phase) {
			$scope.$apply(function() {
				$scope.state = stateMachine.getState();
			});
		} else {
			$scope.state = stateMachine.getState();
		}
	});

	$scope.run = function() {
		stateMachine.to(CONSTANTS.AFTER);
	}

}]);

app.directive("fsmExampleActor", ["PromiseFSM", "asyncConstants", "$timeout", function(FSM, CONSTANTS, $timeout) {

	return {
		scope: true,
		link: function(scope) {

			var stateMachine = FSM.getMachine("asyncMachine");

			scope.status = "I'm idle";

			stateMachine.addTransition(CONSTANTS.BEFORE, CONSTANTS.AFTER, function(done) {
				scope.status = "I'm doing stuff...";

				$timeout(function() {
					scope.status = "I'm done!";
					done();
				}, 1000 + (Math.random() * 2000));
			});

		}
	}

}]);
