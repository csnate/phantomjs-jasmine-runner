(function(target) {
	
	var Circle = function(radius) {
		this.radius = radius;
	};
	
	Circle.prototype.getArea = function() {
		return Math.pow(this.radius, 2) * Math.PI;
	};
	
	Circle.prototype.getPerimeter = function() {
		return 2 * Math.PI * this.radius;
	};
	
	target.Circle = Circle;
	 
})(window.App || (window.App = {}));
