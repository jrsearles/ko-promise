var promiseMethods = ["then", "done", "fail", "catch"];

describe("When creating knockout promise from an observable", function() {
	it("should be observable", function() {
		var promise = ko.promise(ko.observable());
		expect(ko.isObservable(promise)).toBeTruthy();
	});

	it("should have expected promise functions", function() {
		var promise = ko.promise(ko.observable());
		promiseMethods.forEach(function(methodName) {
			expect(promise[methodName]).toBeDefined();
		});
	});

	it("should have an initial state of `pending`", function() {
		var promise = ko.promise(ko.observable());
		expect(promise.state()).toBe("pending");
	});

	it("should resolve when the observable is set", function(done) {
		var underlyingObservable = ko.observable();
		var promise = ko.promise(underlyingObservable);

		promise.then(function(value) {
			expect(value).toBe("foo");
			done();
		});

		underlyingObservable("foo");
	});


	it("should have a state of `fulfilled` when resolved", function(done) {
		var underlyingObservable = ko.observable();
		var promise = ko.promise(underlyingObservable);

		promise.then(function(value) {
			expect(promise.state()).toBe("fulfilled");
			done();
		});

		underlyingObservable("foo");
	});
});

describe("When creating knockout promise from an existing promise", function() {
	it("should be observable", function() {
		var promise = ko.promise(Q.defer().promise);
		expect(ko.isObservable(promise)).toBeTruthy();
	});

	it("should have expected promise functions", function() {
		var promise = ko.promise(Q.defer().promise);
		promiseMethods.forEach(function(methodName) {
			expect(promise[methodName]).toBeDefined();
		});
	});

	it("should resolve when the promise is resolved", function(done) {
		var deferred = Q.defer();
		var promise = ko.promise(deferred.promise);

		promise.then(function(value) {
			expect(value).toBe("foo");
			done();
		});

		deferred.resolve("foo");
	});

	it("should have a state of `fulfilled` when resolved", function(done) {
		var deferred = Q.defer();
		var promise = ko.promise(deferred.promise);

		promise.then(function(value) {
			expect(promise.state()).toBe("fulfilled");
			done();
		});

		deferred.resolve("foo");
	});

	it("should reject when the promise is rejected", function(done) {
		var deferred = Q.defer();
		var promise = ko.promise(deferred.promise);

		promise.fail(function(value) {
			expect(value).toBe("foo");
			done();
		});

		deferred.reject("foo");
	});

	it("should have a state of `rejected` when rejected", function(done) {
		var deferred = Q.defer();
		var promise = ko.promise(deferred.promise);

		promise.fail(function(value) {
			expect(promise.state()).toBe("rejected");
			done();
		});

		deferred.reject("foo");
	});
});

describe("When creating knockout promise from plain value", function() {
	it("should be observable", function() {
		var promise = ko.promise("foo");
		expect(ko.isObservable(promise)).toBeTruthy();
	});

	it("should have expected promise functions", function() {
		var promise = ko.promise("foo");
		promiseMethods.forEach(function(methodName) {
			expect(promise[methodName]).toBeDefined();
		});
	});

	it("should have a state of `fulfilled`", function() {
		var promise = ko.promise("foo");
		expect(promise.state()).toBe("fulfilled");
	});

	it("should resolve with the value", function(done) {
		var promise = ko.promise("foo");

		promise.then(function(value) {
			expect(value).toBe("foo");
			done();
		});
	});
});

describe("When resolving", function() {
	it("should execute the registered functions", function(done) {
		var underlyingObservable = ko.observable();
		var promise = ko.promise(underlyingObservable);

		promise.then(function(value) {
			expect(true).toBeTruthy();
			done();
		});

		underlyingObservable("foo");
	});

	it("should pass the value to the registered functions", function(done) {
		var underlyingObservable = ko.observable();
		var promise = ko.promise(underlyingObservable);

		promise.then(function(value) {
			expect(value).toBe("foo");
			done();
		});

		underlyingObservable("foo");
	});

	it("should pass the value from a resolved function to any subsequent functions", function(done) {
		var underlyingObservable = ko.observable();
		var promise = ko.promise(underlyingObservable);

		promise.then(function(value) {
			return "bar";
		})
		.then(function(value) {
			expect(value).toBe("bar");
			done();
		});

		underlyingObservable("foo");
	});
});

describe("When waiting for all promises", function() {
	it("should be observable", function() {
		var promise = ko.promise.when([ko.observable(), ko.observable()]);
		expect(ko.isObservable(promise)).toBeTruthy();
	});

	it("should have expected promise functions", function() {
		var promise = ko.promise.when([ko.observable(), ko.observable()]);
		promiseMethods.forEach(function(methodName) {
			expect(promise[methodName]).toBeDefined();
		});
	});

	it("should resolve when all are resolved", function(done) {
		var observable1 = ko.observable();
		var observable2 = ko.observable();

		var promise = ko.promise.when([observable1, observable2]);
		promise.then(function() {
			expect(true).toBeTruthy();
			done();
		});

		observable1("foo");
		observable2("bar");
	});

	it("should return resolved values", function(done) {
		var observable1 = ko.observable();
		var observable2 = ko.observable();

		var promise = ko.promise.when([observable1, observable2]);
		promise.then(function(values) {
			expect(values[0]).toBe("foo");
			expect(values[1]).toBe("bar");
			done();
		});

		observable1("foo");
		observable2("bar");
	});

	it("should allow multiple arguments", function(done) {
		var observable1 = ko.observable();
		var observable2 = ko.observable();

		var promise = ko.promise.when(observable1, observable2);
		promise.then(function(values) {
			expect(values[0]).toBe("foo");
			expect(values[1]).toBe("bar");
			done();
		});

		observable1("foo");
		observable2("bar");
	});


	it("should return rejected if any are rejected", function(done) {
		var observable = ko.observable();
		var deferred = Q.defer();

		var promise = ko.promise.when([deferred.promise, observable]);

		promise.fail(function(value) {
			expect(value).toBe("foo");
			done();
		});

		deferred.reject("foo");
	});
});

describe("When waiting for one promise", function() {
	it("should return an observable", function() {
		var promise = ko.promise.race(["foo"]);
		expect(ko.isObservable(promise)).toBeTruthy();
	});

	it("should return the result of the first resolved promise", function(done) {
		var deferred1 = Q.defer();
		var deferred2 = Q.defer();

		var promise = ko.promise.race([deferred1.promise, "foo", deferred2.promise]);

		promise.then(function(value) {
			expect(value).toBe("foo");
			done();
		});

		deferred1.resolve("bar");
		deferred2.resolve("baz");
	});

	it("should allow individual arguments to be passed in", function() {
		var promise = ko.promise.race("foo", "bar");
		expect(ko.isObservable(promise)).toBeTruthy();
	});


	it("should return the result of the first rejected promise", function(done) {
		var deferred = Q.defer();

		var promise = ko.promise.race([deferred.promise, ko.observable()]);

		promise.fail(function(value) {
			expect(value).toBe("foo");
			done();
		});

		deferred.reject("foo");
	});
});