describe('App.Rectangle', function() {
	
	beforeEach(function() {
		this.rectangle = new App.Rectangle(10, 20);
	});
	
	afterEach(function() {
		this.rectangle = null;
	});
	
	it('should instanciate correctly', function() {
		expect(this.rectangle).toBeDefined();
		expect(this.rectangle.width).toEqual(10);
		expect(this.rectangle.height).toEqual(20);
	});
	
	it('can calculate area', function() {
		var area = this.rectangle.getArea();
		
		expect(area).toEqual(200);
	});
	
	it('can calculate perimeter', function() {
		var perimeter = this.rectangle.getPerimeter();
		
		expect(perimeter).toEqual(60);
	});
	
})
