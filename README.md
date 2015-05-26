# PromiseFSM.js

A simple JavaScript Finite State Machine (FSM), using Promises.

This library was written with front-end UI purposes in mind (as seen in the examples), but it should also be usable in other contexts such as Node applications.

#### Features

* Simple yet powerful API.
* Actors can subscribe/unsubscribe to events.
* Actors can add/remove blocking transitions.
* Multiton pattern allows multiple stateMachines to run in parallel.
* Available in different flavours:
  * Vanilla JavaScript.
  * NodeJS module.
  * AngularJS 1.x service module.
  * ... is your fave framework missing? Please [contribute](#contribute).

#### Release notes

##### v0.1.0:

* alpha version

## Getting started

#### Installation

PromiseFSM needs a library to create promises. It has been tested with P by Robert Katić (bundled with PromiseFSM in the `/vendor` folder or get it [here](https://github.com/rkatic/p)) and $q (bundled with AngularJS)

##### Vanilla

Load a promise lib and the library
```
<script src="P.min.js"></script>
<script src="PromiseFSM.min.js"></script>
```

##### AngularJS 1.x

The angular version uses $q (bundled with Angular) as the default promise library, so there's no need to load anything but the module itself:

Load the script

``` html
<script src="PromiseFSM-AngularJS.1.x.min.js"></script>
```
Include the module in your Angular app.

``` javascript
var app = angular.module("myApp", ["PromiseFSMModule"]);
```

#### Usage

To create an instance of a state machine, you need a `name` and some `options`. 

Let's use a door as an example. The door has three states: "open", "closed" or "locked".

```
var name = "doorMachine";
var options = {
	verbose: true, // optional
	initialState: "closed", // optional, if not present initial state will default to first state in the "states" array.
	states: ["opened", "closed", "locked"],
	actions: {
		open   : { from: "closed", to: "opened" },
		close  : { from: "opened", to: "closed" },
		lock   : { from: "closed", to: "locked" },
		unlock : { from: "locked", to: "closed" }
	}
};
```

The specified `actions` will be created as methods on your stateMachine instance. Let's create it:

```
var stateMachine = PromiseFSM.create(name, options);
```
Let's listen to the STATE_CHANGED event:

```
stateMachine.$addEventListener(PromiseFSM.STATE_CHANGED, function(evt) {
	console.log(stateMachine.$getState());
});
```

All set up! Now, to change states, simply invoke the action methods. A simple way to do this would be like this:

```
openButton.onclick = stateMachine.open;
closeButton.onclick = stateMachine.close;
lockButton.onclick = stateMachine.lock;
unlockButton.onclick = stateMachine.unlock;
```
A slightly more advanced example utilizing the fact that action methods returns "then-able" promises:

```
openButton.onclick = function() {
	stateMachine.open().then(function() {
		// state change was successful
	}, function(reason) {
		// state change failed because of reason
	});
};
```

Check the examples folder for more examples using promises.

## API

#### PromiseFSM.setPromiseAdapter(adapter)

Sets what adapter to use for subsequent state machine creation, anything that is Promises/A+ compliant should work (please file an issue if it doesn't).

```
PromiseFSM.setPromiseAdapter(P);
```

#### PromiseFSM.create(name, options)

Creates a new state machine instance and returns its interface.

```
var stateMachine = PromiseFSM.create(name, options);
```

#### PromiseFSM.getMachine(name)

Returns the interface of the state machine instance named `name` or `undefined` if it doesn't exist.

```
var stateMachine = PromiseFSM.getMachine(name);
```

### State machine instances

#### StateMachine.$getState

Returns the current state of the state machine.

```
var currentState = stateMachine.$getState();
```

#### StateMachine.$addTransition(from, to, callback)

Add a blocking transition. Your state machine instance will not change the current state until all transitions have called the `done()` method.

```
stateMachine.$addTransition("state1", "state2", callback);

function callback(done) {

	// do your asynchronous stuff then call done(), so that the stateMachine can 
	// proceed with the state change (or wait for other transitions to complete).

	done();
};
```

#### StateMachine.$removeTransition(from, to, callback)

```
stateMachine.$removeTransition("state1", "state2", callback);
```

#### StateMachine.$addEventListener

```
stateMachine.$addEventListener(type, callback);
```
An event object is passed to the callback with three properties, `type`, `from` (the state we are transitioning from) and `to` (the state we are transitioning to).

When an action method is called, the machine instance emits the following events:

| Type											| When |
|---------------------------|------|
|`PromiseFSM.LOCKED`				|First thing that happens when an action method is called (action methods deactivated)|
|`PromiseFSM.EXIT_STATE`		|Immediately before transition handlers are invoked|
|`PromiseFSM.ENTER_STATE`		|Immediately after all transitions are completed ($getState now returns new state)|
|`PromiseFSM.UNLOCKED`			|State machine is unlocked (action methods reactivated)|
|`PromiseFSM.STATE_CHANGED`	|State change is completed.|

If you don't know what event to listen to, use the `STATE_CHANGED` event.

#### StateMachine.$removeEventListener

Removes an event listener.

```
stateMachine.$removeEventListener(type, callback);
```

## Roadmap/ideas

* Guards
* ES6/ES6-shim Promise by default instead of P
* Test other promise libraries than P and $q
* Version for other frameworks such as Backbone
* Wiki

## Contribute

Feel free to fork this repository and submit pull requests.

1. Clone the repository.
2. Do `npm install` to download the build dependencies.
3. Do your thang.
4. Run `gulp` to test and build. Please check the gulpfile for the complete list of gulp tasks.

If you want to run the tests without gulp, you'll install [mocha](http://mochajs.org/#installation) globally `npm install -g mocha` then run `mocha`.

The idea behind the test names is that they should be easily "grep-able", for example `mocha --grep "#$getState() after_state_change"`.

## Questions/Help/Feature requests

[Submit an issue!](https://github.com/sebastiancarlsson/promise-fsm-js/issues)

## License

The MIT License (MIT)

Copyright (c) 2015 Sebastian Carlsson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

