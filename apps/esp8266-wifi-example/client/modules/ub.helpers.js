/* Random Color */
exports = function() {
    global.randomColour = function() {
        var letters = '0123456789ABCDEF'.split('');
        return (function() {
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(getRandom() * 16)];
            }
            return color;
        })();
    };
};
