var TestController = (function () {
    function TestController() {
    }
    TestController.test = function (req, res) {
        return res.json({
            value: 2
        });
    };
    return TestController;
})();
module.exports = TestController;
