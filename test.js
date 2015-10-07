var should = chai.should();

var name, options, stateMachine;

beforeEach(function() {
  name = "test";
  options = {
    initialState: "state1",
    //verbose: true,
    states: ["state1", "state2", "state3"],
    actions: { 
      action1: { from:"state1", to:"state2" },
      action2: { from:"state2", to:"state3" },
      action3: { from:"state3", to:"state1" },
      action4: { from:["state2","state3"], to:"state1" }
    }
  };
});

describe("PromiseFSM", function() {
	describe("#create()", function() {
    context("without_promise_adapter", function() {
      it("should trow error", function() {
        (function() {
          stateMachine = PromiseFSM.create(name, options)
        }).should.throw(Error);
      });
    });
    
    context("with_valid_options", function() {
      it("should return new machine instance", function() {
        PromiseFSM.setPromiseAdapter(P);
        stateMachine = PromiseFSM.create(name, options);
        stateMachine.should.be.an.Object;
      });
    });
  });

  describe("#getMachine()", function() {
    context("with_invalid_name", function() {
      it("should return undefined", function() {
        should.equal(PromiseFSM.getMachine("somename"), undefined);
      });
    });

    context("with_valid_name", function() {
      it("should return machine instance", function() {
        PromiseFSM.setPromiseAdapter(P);
        stateMachine = PromiseFSM.create(name, options);
        PromiseFSM.getMachine(name).should.equal(stateMachine);
      });
    });
  });
});

describe("stateMachineInstance", function() {
  beforeEach(function() {
    PromiseFSM.setPromiseAdapter(P);
  });

  it("should have automatically generated action methods", function() {
    stateMachine = PromiseFSM.create(name, options);
    stateMachine.action1.should.be.a("function");
    stateMachine.action2.should.be.a("function");
    stateMachine.action3.should.be.a("function");
  });

  describe("#$getState()", function() {
    context("with_initialState_undefined", function() {
      it("should use the first state in options.states as initial state", function() {
        stateMachine = PromiseFSM.create(name, options);
        stateMachine.$getState().should.equal(options.states[0]);
      });
    });

    context("with_initialState_defined", function() {
      it("should return same as options.initialState", function() {
        options.initialState = "state2";
        stateMachine = PromiseFSM.create(name, options);
        stateMachine.$getState().should.equal(options.initialState);
      });
    });

    context("after_state_change", function() {
      it("should return new state name", function() {
        stateMachine = PromiseFSM.create(name, options);
        stateMachine.$getState().should.equal(options.states[0]);
        stateMachine.action1();
        stateMachine.$getState().should.equal(options.states[1]);
      });
    });
  });

  describe("#actionMethods", function() {
    beforeEach(function() {
      stateMachine = PromiseFSM.create(name, options);
    });

    it("should return a \"thenable\"", function() {
      var promise = stateMachine.action1();
      promise.then.should.be.a("function");
    });

    describe("when_transition_is_legal", function() {
      it("should trigger state change", function() {
        stateMachine.action1();
        stateMachine.$getState().should.equal("state2");
      });

      it("should invoke onFulfill callback", function(done) {
        stateMachine.action1().then(function() {
          done();
        }, {
          // not called
        });
      });
    });

    describe("when_transition_is_illegal", function() {
      it("should not trigger state change", function() {
        stateMachine.action2();
        stateMachine.$getState().should.equal("state1");
      });

      it("should invoke onReject callback passing an ILLEGAL_TRANSITION error", function(done) {
        stateMachine.action2().then(onFulfill, onReject);

        function onFulfill() {
          // not called
        }

        function onReject(e) {
          try {
            e.message.should.equal(PromiseFSM.ERRORS.ILLEGAL_TRANSITION);
            done();
          } catch(e) {
            done(e);
          }
        }
      });
    });

    it("should be possible to use multiple 'from' states", function() {
      // Change to state2
      stateMachine.action1();
      stateMachine.$getState().should.equal("state2");
        
      // Change back to state1
      stateMachine.action4();
      stateMachine.$getState().should.equal("state1");

      // Change to state2 again
      stateMachine.action1();
      // Then change to state3
      stateMachine.action2();
      stateMachine.$getState().should.equal("state3");

      // Change back to state1
      stateMachine.action4();
      stateMachine.$getState().should.equal("state1");
    });
  });

  describe("#$addEventListener", function() {
    beforeEach(function() {
      stateMachine = PromiseFSM.create(name, options);
    });

    ["ENTER_STATE", "EXIT_STATE", "LOCKED", "UNLOCKED", "STATE_CHANGED"].forEach(function(key) {
      it("should be possible to subscribe to and receive " + key + " events", function(done) {
        stateMachine.$addEventListener(PromiseFSM.EVENTS[key], function(evt) {
          evt.type.should.equal(PromiseFSM.EVENTS[key]);
          evt.from.should.equal("state1");
          evt.to.should.equal("state2");
          done();
        });
        stateMachine.action1();
      });
    });
  });

  describe("#$removeEventListener", function() {
    beforeEach(function() {
      stateMachine = PromiseFSM.create(name, options);
    });

    ["ENTER_STATE", "EXIT_STATE", "LOCKED", "UNLOCKED", "STATE_CHANGED"].forEach(function(key) {
      it("should be possible to unsubscribe to " + key + " events", function() {
        var receivedOnce = false;
        function listener() {
          if(receivedOnce === true) {
            throw new Error("still subscribed to " + key);
          }
          receivedOnce = true;
        }

        stateMachine.$addEventListener(PromiseFSM.EVENTS[key], listener);
        stateMachine.action1();

        stateMachine.$removeEventListener(PromiseFSM.EVENTS[key], listener);
        stateMachine.action2();
      });
    });
  });

  describe("#$addTransition()", function() {
    beforeEach(function() {
      stateMachine = PromiseFSM.create(name, options);
    });

    it("should be possible to add a synchronous blocking transition", function(done) {
      stateMachine.$addTransition("state1", "state2", function(resolve) {
        stateMachine.$getState().should.equal("state1");
        resolve();
      });
      stateMachine.action1().then(function() {
        try {
          stateMachine.$getState().should.equal("state2");
          done();
        } catch(e) {
          done(e);
        }
      });
    });

    it("should be possible to add an asynchronous blocking transition", function(done) {
      stateMachine.$addTransition("state1", "state2", function(resolve) {
        stateMachine.$getState().should.equal("state1");
        setTimeout(resolve, 50);
      });
      stateMachine.action1().then(function() {
        try {
          stateMachine.$getState().should.equal("state2");
          done();
        } catch(e) {
          done(e);
        }
      });
    });

    it("should be possible to add several synchronous blocking transitions", function(done) {
      stateMachine.$addTransition("state1", "state2", function(resolve) {
        stateMachine.$getState().should.equal("state1");
        resolve();
      });

      stateMachine.$addTransition("state1", "state2", function(resolve) {
        stateMachine.$getState().should.equal("state1");
        resolve();
      });

      stateMachine.$addTransition("state1", "state2", function(resolve) {
        stateMachine.$getState().should.equal("state1");
        resolve();
      });

      stateMachine.action1().then(function() {
        try {
          stateMachine.$getState().should.equal("state2");
          done();
        } catch(e) {
          done(e);
        }
      });
    });

    it("should be possible to add several asynchronous blocking transitions", function(done) {
      var firstDone = false;
      var secondDone = false;
      var thirdDone = false;

      stateMachine.$addTransition("state1", "state2", function(resolve) {
        setTimeout(function() {
          firstDone = true;
          resolve();
        }, 20);
      });

      stateMachine.$addTransition("state1", "state2", function(resolve) {
        setTimeout(function() {
          secondDone = true;
          resolve();
        }, 40);
      });

      stateMachine.$addTransition("state1", "state2", function(resolve) {
        setTimeout(function() {
          thirdDone = true;
          resolve();
        }, 60);
      });

      stateMachine.action1().then(function() {
        try {
          (firstDone).should.be.true;
          (secondDone).should.be.true;
          (thirdDone).should.be.true;
          done();
        } catch(e) {
          done(e);
        }
      });
    });

    it("should be possible to mix synchronous and asynchronous transitions", function(done) {
      stateMachine.$addTransition("state1", "state2", function(resolve) {
        stateMachine.$getState().should.equal("state1");
        resolve();
      });

      stateMachine.$addTransition("state1", "state2", function(resolve) {
        setTimeout(function() {
          resolve();
        }, 50);
      });

      stateMachine.$addTransition("state1", "state2", function(resolve) {
        stateMachine.$getState().should.equal("state1");
        resolve();
      });

      stateMachine.action1().then(function() {
        try {
          stateMachine.$getState().should.equal("state2");
          done();
        } catch(e) {
          done(e);
        }
      });
    });

    it("callback should retrieve arguments passed to action methods", function(done) {
      stateMachine.$addTransition("state1", "state2", function(resolve, param1, param2) {
        should.exist(param1);
        param1.should.equal("param1");
        should.exist(param2);
        param2.should.equal("param2");
        resolve();
      });
      stateMachine.action1("param1", "param2").then(function() {
        done();
      });
    })
  });

  describe("#$removeTransition()", function() {
    beforeEach(function() {
      stateMachine = PromiseFSM.create(name, options);
    });

    it("should be possible to remove a blocking transition", function(done) {
      function doAsyncStuff(resolve) {
        throw new Error("doAsyncStuff() called");
      }

      stateMachine.$addTransition("state1", "state2", doAsyncStuff);
      stateMachine.$removeTransition("state1", "state2", doAsyncStuff);
      stateMachine.action1().then(completeTest);

      function completeTest() {
        try {
          stateMachine.$getState().should.equal("state2");
          done();
        } catch(e) {
          done(e);
        }
      }
    });
  });
});