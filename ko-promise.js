(function(ko, undefined) {
	var slice = Array.prototype.slice;
	var states = {
		pending: "pending",
		fulfilled: "fulfilled",
		rejected: "rejected"
	};

	function isPromise(obj) {
		return obj && typeof obj.then == "function";
	}

	function createResolver(callback, resolveObservable, stateObservable, expectedState) {
		var fired = false;
		var resolvedValue;

		return ko.computed(function() {
			if (stateObservable() == expectedState) {
				if (callback && !fired) {
					fired = true;
					resolvedValue = callback(resolveObservable());
				}

				if (resolvedValue === undefined) {
					resolvedValue = resolveObservable();
				}

				return resolvedValue;
			}

			return undefined;
		});
	}

	function writeOnceObservable() {
		// only allow the observable to be written to once - all subsequent writes will be ignored
		var underlyingObservable = ko.observable();
		return ko.computed({
			read: underlyingObservable,
			write: function(value) {
				if (underlyingObservable() === undefined) {
					underlyingObservable(value);
				}
			}
		});
	}

	function promiseToObservable(promise) {
		var valueObservable = ko.observable();
		var rejectObservable = ko.observable();

		promise.then(valueObservable, rejectObservable);

		// wrap the value observable in a computed so that it is functionally readonly
		return koToPromise(ko.computed({ read: valueObservable }), rejectObservable);
	}

	function koToPromise(valueObservable, rejectObservable, alreadyResolved) {
		rejectObservable = rejectObservable || ko.observable();

		var priorState = alreadyResolved ? states.fulfilled : states.pending;
		var state = valueObservable.state = ko.computed(function() {
			// after a state is set it is unchangable
			if (priorState !== states.pending) {
				return priorState;
			}

			if (valueObservable() !== undefined) {
				return (priorState = states.fulfilled);
			}

			if (rejectObservable() !== undefined) {
				return (priorState = states.rejected);
			}

			return states.pending;
		});

		valueObservable.then = function(onFulfilled, onRejected) {
			return koToPromise(createResolver(onFulfilled, valueObservable, state, states.fulfilled), createResolver(onRejected, rejectObservable, state, states.rejected));
		};

		valueObservable.done = function(onFulfilled) {
			return this.then(onFulfilled);
		};

		valueObservable["catch"] = valueObservable.fail = function(onRejected) {
			return this.then(null, onRejected);
		};

		valueObservable.always = function(onResolved) {
			// add to both queues so it fires whether it's fulfilled or rejected
			return this.then(onResolved, onResolved);
		};

		var originalDispose = valueObservable.dispose;
		valueObservable.dispose = function() {
			valueObservable.state.dispose();

			if (rejectObservable.dispose) {
				rejectObservable.dispose();
			}

			if (originalDispose) {
				originalDispose.call(valueObservable);
			}
		};

		return valueObservable;
	}

	function valueToPromise(value) {
		return koToPromise(ko.observable(value), ko.observable(), true);
	}

	// entry point
	var koPromise = ko.promise = function(obj) {
		if (isPromise(obj)) {
			// if it is already an observable promise, just return the object
			if (ko.isObservable(obj)) {
				return obj;
			}

			return promiseToObservable(obj);
		}

		if (ko.isObservable(obj)) {
			return koToPromise(obj);
		}

		return valueToPromise(obj);
	};

	// static methods
	koPromise.all = koPromise.when = function(promises) {
		// if an array isn't passed in convert the arguments to an array
		// this allows either an array or multiple arguments to be used
		promises = Array.isArray(promises) ? promises : slice.call(arguments);
		var values = [];
		var pendingCount = ko.observable(promises.length);
		var rejectValue = ko.observable();

		var resolvedValues = ko.computed(function() {
			// only return values once all promises are resolved
			// returning a value will in effect resolve the `when` promise
			if (pendingCount() === 0) {
				return values;
			}

			return undefined;
		});

		var resolver = function(value, index) {
			values[index] = value;
			pendingCount(pendingCount() - 1);
		};

		promises.forEach(function(current, index) {
			if (isPromise(current) || ko.isObservable(current)) {
				koPromise(current)
					.then(function(value) { resolver(value, index); }, rejectValue);
			} else {
				resolver(current, index);
			}
		});

		return koToPromise(resolvedValues, rejectValue);
	};

	koPromise.race = function(promises) {
		promises = Array.isArray(promises) ? promises : slice.call(arguments);
		var resolver = writeOnceObservable();
		var rejector = writeOnceObservable();
		var current;

		for (var i = 0, ln = promises.length; i < ln; i++) {
			current = promises[i];
			if (isPromise(current) || ko.isObservable(current)) {
				koPromise(current).then(resolver, rejector);
			} else {
				// if we have a plain value there is no need to continue processing as this will win
				resolver(current);
				break;
			}
		}

		return koToPromise(resolver, rejector);
	};
})(ko);