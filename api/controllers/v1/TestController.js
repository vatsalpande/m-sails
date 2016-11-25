"use strict";
var TestController = (function () {
    function TestController() {
    }
    TestController.test = function (req, res) {
        return res.json({
            value: 1
        });
    };
    return TestController;
}());
module.exports = TestController;
