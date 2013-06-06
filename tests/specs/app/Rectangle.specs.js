describe('App.Rectangle', function() {
	
	var rectangle;
	
	beforeEach(function() {
		rectangle = new App.Rectangle(10, 20);
	});
	
	afterEach(function() {
		rectangle = null;
	});
	
	it('can create a rectangle', function() {
		expect(rectangle).toBeDefined();
		expect(rectangle.width).toEqual(10);
		expect(rectangle.height).toEqual(20);
	});
	
	it('can calculate area', function() {
		var area = rectangle.getArea();
		
		expect(area).toEqual(200);
	});
	
	it('can calculate perimeter', function() {
		var perimeter = rectangle.getPerimeter();
		
		expect(perimeter).toEqual(60);
	});
	
})
