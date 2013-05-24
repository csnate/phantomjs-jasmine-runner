(function(target) {
	
	var Rectangle = function(width, height) {
		this.width = width;
		this.height = height;
	};
	
	Rectangle.prototype.getArea = function() {
		return this.width * this.height;
	};
	
	Rectangle.prototype.getPerimeter = function() {
		return 2 * (this.width + this.height);
	};
	
	target.Rectangle = Rectangle;
	 
})(window.App || (window.App = {}));
