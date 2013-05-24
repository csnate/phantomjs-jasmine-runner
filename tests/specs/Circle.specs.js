describe('App.Circle', function() {
	
	beforeEach(function() {
		this.circle = new App.Circle(5);
	});
	
	afterEach(function() {
		this.circle = null;
	});
	
	it('should instanciate correctly', function() {
		expect(this.circle).toBeDefined();
		expect(this.circle.radius).toEqual(5);
	});
	
	it('can calculate area', function() {
		var area = this.circle.getArea();
		
		expect(area).toBeCloseTo(78.54);
	});
	
	it('can calculate perimeter', function() {
		var perimeter = this.circle.getPerimeter();
		
		expect(perimeter).toBeCloseTo(31.42);
	});
});
