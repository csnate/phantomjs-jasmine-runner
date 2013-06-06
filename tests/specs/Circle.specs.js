describe('App.Circle', function() {
	
	var circle;
	
	beforeEach(function() {
		circle = new App.Circle(5);
	});
	
	afterEach(function() {
		circle = null;
	});
	
	it('can create a circle', function() {
		expect(circle).toBeDefined();
		expect(circle.radius).toEqual(5);
	});
	
	it('can calculate area', function() {
		var area = circle.getArea();
		
		expect(area).toBeCloseTo(78.54);
	});
	
	it('can calculate perimeter', function() {
		var perimeter = circle.getPerimeter();
		
		expect(perimeter).toBeCloseTo(31.42);
	});
});
